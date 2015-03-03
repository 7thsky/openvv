/**
 * Copyright (c) 2013 Open VideoView
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
 * documentation files (the "Software"), to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
 * to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of
 * the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
 * THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 * TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

/**
 * A container for all OpenVV instances running on the page
 * @class
 * @constructor
 */
function OVV() {

    ///////////////////////////////////////////////////////////////////////////
    // PUBLIC ATTRIBUTES
    ///////////////////////////////////////////////////////////////////////////

    /**
     * Determines whether OpenVV should run in debug mode. Debug mode always
     * adds beacon SWFs to the page, which are color-coded based on their
     * status. OVVCheck.beaconViewabilityState and
     * OVVCheck.geometryViewabilityState are also populated in debug mode.
     * @type {Boolean}
     * @see {@link OVVCheck#geometryViewabilityState}
     * @see {@link OVVCheck#beaconViewabilityState}
     * @see {@link OVVAsset#BEACON_SIZE}
     */
    this.DEBUG = false;

    /**
     * Whether OpenVV is running within an iframe or not.
     * @type {Boolean}
     */
    this.IN_IFRAME = (window.top !== window.self);

    /**
     * The last asset added to OVV. Useful for easy access from the
     * JavaScript console.
     * @type {OVVAsset}
     */
    this.asset = null;

    var userAgent = window.testOvvConfig && window.testOvvConfig.userAgent ? window.testOvvConfig.userAgent : navigator.userAgent;

    /**
     * Returns an object that contains the browser name, version and id {@link OVV#browserIDEnum}
     * @param {String} ua browser user agent string
     * @return {{ ID : String, name: String, version: String, ua: String }}
     */
    function getBrowserDetailsByUserAgent(ua) {

		var getData = function () {			
			var data = { ID: 0, name: '', version: '', ua: ua };
			var dataString = ua;
			for (var i = 0; i < dataBrowsers.length; i++) {
				// Fill Browser ID
				if (dataString.match(new RegExp(dataBrowsers[i].brRegex)) != null) {
					data.ID = dataBrowsers[i].id;
					data.name = dataBrowsers[i].name;
					if (dataBrowsers[i].verRegex == null) {
						break;
					}
					//Fill Browser Version
					var brverRes = dataString.match(new RegExp(dataBrowsers[i].verRegex + '[0-9]*'));
					if (brverRes != null) {
						var replaceStr = brverRes[0].match(new RegExp(dataBrowsers[i].verRegex));
						data.version = brverRes[0].replace(replaceStr[0], '');
					}
					break;
				}
			}

			return data;
		};

		var dataBrowsers = [{
				id: 4,
				name: 'Opera',
				brRegex: 'OPR|Opera',
				verRegex: '(OPR\/|Version\/)'
			}, {
				id: 1,
				name: 'MSIE',
				brRegex: 'MSIE|Trident/7.*rv:11|rv:11.*Trident/7',
				verRegex: '(MSIE |rv:)'
			}, {
				id: 2,
				name: 'Firefox',
				brRegex: 'Firefox',
				verRegex: 'Firefox\/'
			}, {
				id: 3,
				name: 'Chrome',
				brRegex: 'Chrome',
				verRegex: 'Chrome\/'
			}, {
				id: 5,
				name: 'Safari',
				brRegex: 'Safari|(OS |OS X )[0-9].*AppleWebKit',
				verRegex: 'Version\/'
			}
		];

		return getData();
	}

    /**
     * @type {{ MSIE: number, Firefox: number, Chrome: number, Opera: number, safari: number }}
     */
    this.browserIDEnum = {
        MSIE     : 1,
        Firefox  : 2,
        Chrome   : 3,
        Opera    : 4,
        safari   : 5
    };

    /**
     * @type {{ ID: Number, name: String, version: String }}
     */
    this.browser = getBrowserDetailsByUserAgent(userAgent);

    /**
     * The interval in which ActionScript will poll OVV for viewability
     * information
     * @type {Number}
     */
    this.interval = INTERVAL;

    /**
     * OVV version
     * @type {Number}
     */
    this.version = VERSION;

    ///////////////////////////////////////////////////////////////////////////
    // PRIVATE ATTRIBUTES
    ///////////////////////////////////////////////////////////////////////////

    /**
     * An object for storing OVVAssets. {@link OVVAsset}s are stored with their
     * id as the key and the OVVAsset as the value.
     * @type {Object}
     */
    var assets = {};

    /**
     * An array for storing the first PREVIOUS_EVENTS_CAPACITY events for each event type. {@see PREVIOUS_EVENTS_CAPACITY}
     * @type {Array}
     */
    var previousEvents = [];

    /**
     * Number of event to store
     * @type {int}
     */
    var PREVIOUS_EVENTS_CAPACITY = 1000;

    /**
     * An array that holds all the subscribes for a eventName+uid combination
     * @type {Array}
     */
    var subscribers = [];

    ///////////////////////////////////////////////////////////////////////////
    // PUBLIC FUNCTIONS
    ///////////////////////////////////////////////////////////////////////////

    /**
     * Stores an asset which can be retrieved later using
     * {@link OVV#getAssetById}. The latest asset added to OVV can also be
     * retrieved via the {@link OVV#asset} property.
     * @param {OVVAsset} ovvAsset An asset to observe
     */
    this.addAsset = function(ovvAsset) {
        if (!assets.hasOwnProperty(ovvAsset.getId())) {
            assets[ovvAsset.getId()] = ovvAsset;
            // save a reference for convenience
            this.asset = ovvAsset;
        }
    };

    /**
     * Removes an {@link OVVAsset} from OVV.
     * @param {OVVAsset} ovvAsset An {@link OVVAsset} to remove
     */
    this.removeAsset = function(ovvAsset) {
        delete assets[ovvAsset.getId()];
    };

    /**
     * Retrieves an {@link OVVAsset} based on its ID
     * @param {String} id The id of the element to retrieve
     * @returns {OVVAsset|null} The element matching the given ID, or null if
     * one could not be found
     */
    this.getAssetById = function(id) {
        return assets[id];
    };

    /**
     * @returns {Object} Object an object containing all of the OVVAssets being tracked
     */
    this.getAds = function() {
        var copy = {};
        for (var id in assets) {
            if (assets.hasOwnProperty(id)) {
                copy[id] = assets[id];
            }
        }
        return copy;
    };

    /**
     * Subscribe the {func} to the list of {events}. When getPreviousEvents is true all the stored events that were passed will be fired
     * in a chronological order
     * @param {Array.<String>} events array with all the event names to subscribe to
     * @param {String} uid asset identifier
     * @param {function(String,String)} func a function to execute once the assert raise the event
     * @param {Boolean} getPreviousEvents if true all buffered event will be triggered
     */
    this.subscribe = function(events, uid, func, getPreviousEvents) {

        if (getPreviousEvents) {
            for (key in previousEvents[uid]) {
                if (contains(previousEvents[uid][key].eventName, events)) {
                    runSafely(function() {
                        func(uid, previousEvents[uid][key]); // changed in vtag.js
                    });
                }
            }
        }

        for (key in events) {
            if (!subscribers[events[key] + uid])
                subscribers[events[key] + uid] = [];
            subscribers[events[key] + uid].push({
                Func: func
            });
        }
    };

    /**
     * Publish {eventName} to all the subscribers. Also, storing the publish event in a buffered array is the capacity wasn't reached
     * @param {String} eventName name of the event to publish
     * @param {String} uid asset identifier
     * @param {Array} args argument to send to the published function
     */
    this.publish = function(eventName, uid, args) {
        var eventArgs = {
            eventName: eventName,
            eventTime: getCurrentTime(),
            ovvArgs: args
        };

        if (!previousEvents[uid]) {
            previousEvents[uid] = [];
        }
        if (previousEvents[uid].length < PREVIOUS_EVENTS_CAPACITY) {
            previousEvents[uid].push(eventArgs);
        }

        if (eventName && uid && subscribers[eventName + uid] instanceof Array) {
            for (var i = 0; i < subscribers[eventName + uid].length; i++) {
                var funcObject = subscribers[eventName + uid][i];
                if (funcObject && funcObject.Func && typeof funcObject.Func === "function") {
                    runSafely(function() {
                        funcObject.Func(uid, eventArgs);
                    });
                }
            }
        }
    };

    /**
     * @return {Number}
     */
    var getCurrentTime = function() {
        "use strict";
        if (Date.now) {
            return Date.now();
        }
        return (new Date()).getTime();
    };

    /**
     * @param {*} item
     * @param {Array} list
     * @return {Boolean}
     */
    var contains = function(item, list) {
        for (var i = 0; i < list.length; i++) {
            if (list[i] === item) {
                return true;
            }
        }
        return false;
    };

    /**
     * @param {function} action
     * @return {*}
     */
    var runSafely = function(action) {
        try {
            var ret = action();
            return ret !== undefined ? ret : true;
        } catch (e) {
            return false;
        }
    };
}

/**
 * A container for all the values that OpenVV collects.
 * @class
 * @constructor
 */
function OVVCheck() {

    ///////////////////////////////////////////////////////////////////////////
    // PUBLIC ATTRIBUTES
    ///////////////////////////////////////////////////////////////////////////

    /**
     * The height of the viewport
     * @type {Number}
     */
    this.clientHeight = -1;

    /**
     * The width of the viewport
     * @type {Number}
     */
    this.clientWidth = -1;

    /**
     * A description of any error that occured
     * @type {String}
     */
    this.error = '';

    /**
     * Whether the tab is focused or not (populated by ActionScript)
     * @type {Boolean}
     */
    this.focus = null;

    /**
     * The framerate of the asset (populated by ActionScript)
     * @type {Number}
     */
    this.fps = -1;

    /**
     * A unique identifier of the asset
     * @type {String}
     */
    this.id = '';

    /**
     * Whether beacon checking is supported. Beacon support is defined by
     * placing a "control beacon" SWF off screen, and verifying that it is
     * throttled as expected.
     * @type {Boolean}
     */
    this.beaconsSupported = null;

    /**
     * Whether geometry checking is supported. Geometry support requires
     * that the asset is not within an iframe.
     * @type {Boolean}
     */
    this.geometrySupported = null;

    /**
     * The viewability state measured by the geometry technique. Only populated
     * when OVV.DEBUG is true.
     * @type {String}
     * @see {@link OVVAsset#checkGeometry}
     * @see {@link OVV#DEBUG}
     */
    this.geometryViewabilityState = '';

    /**
     * The viewability state measured by the beacon technique. Only populated
     * when OVV.DEBUG is true.
     * @type {String}
     * @see {@link OVVAsset#checkBeacons}
     * @see {@link OVV#DEBUG}
     */
    this.beaconViewabilityState = '';

    /**
     * The technique used to populate OVVCheck.viewabilityState. Will be either
     * OVV.GEOMETRY when OVV is run in the root page, or OVV.BEACON when OVV is
     * run in an iframe. When in debug mode, will always remain blank.
     * @type {String}
     * @see {@link OVV#GEOMETRY}
     * @see {@link OVV#BEACON}
     */
    this.technique = '';

    /**
     * When OVV is run in an iframe and the beacon technique is used, this array
     * is populated with the states of each beacon, identified by their index.
     * True means the beacon was viewable and false means the beacon was
     * unviewable. Beacon 0 is the "control beacon" and should always be false.
     * @type {Array.<Boolean>|null}
     * @see {@link OVVAsset.CONTROL}
     * @see {@link OVVAsset.CENTER}
     * @see {@link OVVAsset.OUTER_TOP_LEFT}
     * @see {@link OVVAsset.OUTER_TOP_RIGHT}
     * @see {@link OVVAsset.OUTER_BOTTOM_LEFT}
     * @see {@link OVVAsset.OUTER_BOTTOM_RIGHT}
     * @see {@link OVVAsset.MIDDLE_TOP_LEFT}
     * @see {@link OVVAsset.MIDDLE_TOP_RIGHT}
     * @see {@link OVVAsset.MIDDLE_BOTTOM_LEFT}
     * @see {@link OVVAsset.MIDDLE_BOTTOM_RIGHT}
     * @see {@link OVVAsset.INNER_TOP_LEFT}
     * @see {@link OVVAsset.INNER_TOP_RIGHT}
     * @see {@link OVVAsset.INNER_BOTTOM_LEFT}
     * @see {@link OVVAsset.INNER_BOTTOM_RIGHT}
     */
    this.beacons = new Array();

    /**
     * Whether this asset is in an iframe.
     * @type {Boolean}
     * @see {@link OVV#IN_IFRAME}
     * @see {@link OVV#DEBUG}
     */
    this.inIframe = null;

    /**
     * The distance, in pixels, from the bottom of the asset to the bottom of
     * the viewport
     * @type {Number}
     */
    this.objBottom = -1;

    /**
     * The distance, in pixels, from the left of the asset to the left of
     * the viewport
     * @type {Number}
     */
    this.objLeft = -1;

    /**
     * The distance, in pixels, from the right of the asset to the right of
     * the viewport
     * @type {Number}
     */
    this.objRight = -1;

    /**
     * The distance, in pixels, from the top of the asset to the top of
     * the viewport
     * @type {Number}
     */
    this.objTop = -1;

    /**
     * The percentage of the player that is viewable within the viewport
     * @type {Number}
     */
    this.percentViewable = -1;

    /**
     * Set to {@link OVVCheck#VIEWABLE} when the player was at least 50%
     * viewable. Set to OVVCheck when the player was less than 50% viewable.
     * Set to {@link OVVCheck#UNMEASURABLE} when a determination could not be made.
     * @type {String}
     * @see {@link OVVCheck.UNMEASURABLE}
     * @see {@link OVVCheck.VIEWABLE}
     * @see {@link OVVCheck.UNVIEWABLE}
     * @see {@link OVVCheck.NOT_READY}
     */
    this.viewabilityState = '';
}


/**
 * The value that {@link OVVCheck#viewabilityState} will be set to if OVV cannot
 * determine whether the asset is at least 50% viewable.
 */
OVVCheck.UNMEASURABLE = 'unmeasurable';

/**
 * The value that {@link OVVCheck#viewabilityState} will be set to if OVV
 * determines that the asset is at least 50% viewable.
 */
OVVCheck.VIEWABLE = 'viewable';

/**
 * The value that {@link OVVCheck#viewabilityState} will be set to if OVV
 * determines that the asset is less than 50% viewable.
 */
OVVCheck.UNVIEWABLE = 'unviewable';

/**
 * The value that {@link OVVCheck#viewabilityState} will be set to if the beacons
 * are not ready to determine the viewability state
 */
OVVCheck.NOT_READY = 'not_ready';

/**
 * The value that {@link OVVCheck#technique} will be set to if OVV
 * uses the beacon technique to determine {@link OVVCheck#viewabilityState}
 */
OVVCheck.BEACON = 'beacon';

/**
 * The value that {@link OVVCheck#technique} will be set to if OVV
 * uses the geometry technique to determine {@link OVVCheck#viewabilityState}
 */
OVVCheck.GEOMETRY = 'geometry';

/**
 * Represents an Asset which OVV is going to determine the viewability of
 * @constructor
 * @param {String} uid - The unique identifier of this asset
 */
function OVVAsset(uid) {

    ///////////////////////////////////////////////////////////////////////////
    // CONSTANTS
    ///////////////////////////////////////////////////////////////////////////

    /**
     * The total number of beacons being used
     * @type {Number}
     */
    var TOTAL_BEACONS = 13;

    /**
     * The value of the square root of 2. Computed here and saved for reuse
     * later. Approximately 1.41.
     * @type {Number}
     */
    var SQRT_2 = Math.sqrt(2);

    /**
     * The index/identifier of the control beacon, which is placed off screen to
     * test that throttling occurs.
     * @type {Number}
     */
    var CONTROL = 0;

    /**
     * The index/identifier of the center beacon, which is placed in the center
     * of the player.
     * @type {Number}
     */
    var CENTER = 1;

    /**
     * The index/identifier of the beacon placed at the top left corner of the
     * player.
     * @type {Number}
     */
    var OUTER_TOP_LEFT = 2;

    /**
     * The index/identifier of the beacon placed at the top right corner of the
     * player.
     * @type {Number}
     */
    var OUTER_TOP_RIGHT = 3;

    /**
     * The index/identifier of the beacon placed at the bottom left corner of
     * the player.
     * @type {Number}
     */
    var OUTER_BOTTOM_LEFT = 4;

    /**
     * The index/identifier of the beacon placed at the bottom right corner of
     * the player.
     * @type {Number}
     */
    var OUTER_BOTTOM_RIGHT = 5;

    /**
     * The index/identifier of the beacon placed at the top left corner of the
     * middle area. The middle area defines a region which is 50% of the total
     * area of the player.
     * @type {Number}
     */
    var MIDDLE_TOP_LEFT = 6;

    /**
     * The index/identifier of the beacon placed at the top right corner of the
     * middle area. The middle area defines a region which is 50% of the total
     * area of the player.
     * @type {Number}
     */
    var MIDDLE_TOP_RIGHT = 7;

    /**
     * The index/identifier of the beacon placed at the bottom left corner of
     * the middle area. The middle area defines a region which is 50% of the total
     * area of the player.
     * @type {Number}
     */
    var MIDDLE_BOTTOM_LEFT = 8;

    /**
     * The index/identifier of the beacon placed at the bottom right corner of
     * the middle area. The middle area defines a region which is 50% of the total
     * area of the player.
     * @type {Number}
     */
    var MIDDLE_BOTTOM_RIGHT = 9;

    /**
     * The index/identifier of the beacon placed at the top left corner of
     * the inner area. The inner area defines a region such that the area
     * outside 2 sides of it are 50% of the player's total area.
     * @type {Number}
     */
    var INNER_TOP_LEFT = 10;

    /**
     * The index/identifier of the beacon placed at the top right corner of
     * the inner area. The inner area defines a region such that the area
     * outside 2 sides of it are 50% of the player's total area.
     * @type {Number}
     */
    var INNER_TOP_RIGHT = 11;

    /**
     * The index/identifier of the beacon placed at the bottom left corner of
     * the inner area. The inner area defines a region such that the area
     * outside 2 sides of it are 50% of the player's total area.
     * @type {Number}
     */
    var INNER_BOTTOM_LEFT = 12;

    /**
     * The index/identifier of the beacon placed at the bottom right corner of
     * the inner area. The inner area defines a region such that the area
     * outside 2 sides of it are 50% of the player's total area.
     * @type {Number}
     */
    var INNER_BOTTOM_RIGHT = 13;

    /**
     * millisecond delay between repositioning beacons
     * @type {number}
     */
    var positionBeaconsIntervalDelay = 500;

    ///////////////////////////////////////////////////////////////////////////
    // PRIVATE ATTRIBUTES
    ///////////////////////////////////////////////////////////////////////////

    /**
     * the id of the ad that this asset is associatied with
     * @type {!String}
     */
    var id = uid;

    /**
     * The numer of beacons that have checked in as being ready
     * @type {Number}
     */
    var beaconsStarted = 0;

    /**
     * The height and width of the beacons on the page. 1 for production, 20
     * for {@link OVV#DEBUG} mode.
     * @type {Number}
     */
    var BEACON_SIZE = $ovv.DEBUG ? 20 : 1;

    /**
     * The last known location of the player on the page
     * @type {ClientRect}
     */
    var lastPlayerLocation;

    /**
     * The video player being measured
     * @type {Element}
     */
    var player;

    var visibilityBrowserProperty = null;

    /**
     * hold a reference to a function that get the relevant beacon
     * @type {function}
     */
    var getBeaconFunc = function() {return null};

    /**
     * hold a reference to a function that get the relevant beacon continer
     * @type {function}
     */
    var getBeaconContainerFunc = function() {return null};

    ///////////////////////////////////////////////////////////////////////////
    // PUBLIC FUNCTIONS
    ///////////////////////////////////////////////////////////////////////////

    /**
     * <p>
     * Returns an {@link OVVCheck} object populated with information gathered
     * from the browser. The viewabilityState attribute is populated with
     * either {@link OVVCheck.VIEWABLE}, {@link OVVCheck.UNVIEWABLE}, or {@link OVVCheck.UNMEASURABLE}
     * as determined by either xbeacon technique when in an iframe, or the
     * geometry technique otherwise.
     * </p><p>
     * The geometry technique compares the bounds of the viewport, taking
     * scrolling into account, and the bounds of the player.
     * </p><p>
     * The beacon technique places a single beacon offscreen and several
     * on top of the player. It then queries the state of the beacons on top
     * of the player to determine how much of the player is viewable.
     * </p>
     * @returns {OVVCheck}
     * @see {@link OVVCheck}
     * @see {@link checkGeometry}
     * @see {@link checkBeacons}
     */
    this.checkViewability = function() {

        var check = new OVVCheck();
        check.id = id;
        check.inIframe = $ovv.IN_IFRAME;
        check.geometrySupported = isGeometryTechniqueApplicable();

        check.focus = isInFocus();

        if (!player) {
            check.error = 'Player not found!';
            return check;
        }

        if ((!isGeometryTechniqueApplicable() && !isBeaconsTechniqueApplicable()) || (isChromeOnMac && $ovv.IN_IFRAME)) {
            check.viewabilityState = OVVCheck.UNMEASURABLE;
            if (!$ovv.DEBUG) {
                return check;
            }
        }

        // if we can use the geometry method, use it over the beacon method
        if (check.geometrySupported) {
            check.technique = OVVCheck.GEOMETRY;
            checkGeometry.bind(this)(check, player);
            check.viewabilityState = (check.percentViewable >= 50) ? OVVCheck.VIEWABLE : OVVCheck.UNVIEWABLE;

            if ($ovv.DEBUG) {
                // add an additonal field when debugging
                check.geometryViewabilityState = check.viewabilityState;
            } else {
                return check;
            }
        }

        var controlBeacon = getBeacon(0);
        var controlBeaconContainer = getBeaconContainer(0);
        var _cbVisible = false;
        var _cbOnScreen = false;
        var _cbHasIsViewableMethod = false;

        // check to make sure the control beacon is found and its
        // callback has been setup
        if (controlBeacon && controlBeaconContainer) {
            try {
                _cbVisible = controlBeacon.isViewable();
                _cbHasIsViewableMethod = true;
            } catch (e) {}

            _cbOnScreen = isOnScreen(controlBeaconContainer);

            // the control beacon should always be off screen and not viewable,
            // if that's not true, it can't be used
            check.beaconsSupported = !(_cbOnScreen && _cbVisible);
        } else {
            // if the control beacon wasn't found or it isn't ready yet,
            // then beacons can't be used for this check
            check.beaconsSupported = false;
        }

        if (!check.beaconsSupported) {
            traceIt('cb(' + controlBeacon + ', ' + _cbVisible + ', ' + _cbOnScreen + ', ' + _cbHasIsViewableMethod + ')');
        }

        if (!beaconsReady()) {
            check.technique = OVVCheck.BEACON;
            check.viewabilityState = OVVCheck.NOT_READY;
        } else if (check.beaconsSupported) { // if the control beacon checked out, and all the beacons are ready proceed
            check.technique = OVVCheck.BEACON;      
            var viewable = checkBeacons.bind(this)(check);
            // certain scenarios return null when the beacons can't guarantee
            // that the player is > 50% viewable, so it's deemed unmeasurable
            if (viewable === null) {
                check.viewabilityState = OVVCheck.UNMEASURABLE;
                // add this informational field when debugging
                if ($ovv.DEBUG) {
                    check.beaconViewabilityState = OVVCheck.UNMEASURABLE;
                }
            } else {
                check.viewabilityState = viewable ? OVVCheck.VIEWABLE : OVVCheck.UNVIEWABLE;
                // add this informational field when debugging
                if ($ovv.DEBUG) {
                    check.beaconViewabilityState = viewable ? OVVCheck.VIEWABLE : OVVCheck.UNVIEWABLE;
                }
            }
        } else {
            check.viewabilityState = OVVCheck.UNMEASURABLE;
        }

        // in debug mode, reconcile the viewability states from both techniques
        if ($ovv.DEBUG) {
            // revert the technique to blank during debug, since both were used
            check.technique = '';
            if (check.geometryViewabilityState === null && check.beaconViewabilityState === null) {
                check.viewabilityState = OVVCheck.UNMEASURABLE;
            } else {
                var beaconViewable = (check.beaconViewabilityState === OVVCheck.VIEWABLE);
                var geometryViewable = (check.geometryViewabilityState === OVVCheck.VIEWABLE);
                check.viewabilityState = (beaconViewable || geometryViewable) ? OVVCheck.VIEWABLE : OVVCheck.UNVIEWABLE;
            }
        }

        return check;
    };

    /**
     * Called by each beacon to signify that it's ready to measure
     * @param {Number} index The index identifier of the beacon
     */
    this.beaconStarted = function(index) {
        traceIt('beacon ' + index + ' - ready!!!');

        if ($ovv.DEBUG) {
            getBeacon(index).debug();
        }

        if (index === 0) {
            return;
        }

        beaconsStarted++;

        if (beaconsReady()) {
            player.startImpressionTimer();
        }
    };

    /**
     * Frees up resources created and used by the asset.
     */
    this.dispose = function() {

        for (var index = 1; index <= TOTAL_BEACONS; index++) {
            var container = getBeaconContainer(index);
            if (container) {
                delete beaconsStarted[index];
                container.parentElement.removeChild(container);
            }
        }

        window.$ovv.removeAsset(this);
    };

    /**
     * @returns {String} The randomly generated ID of this asset
     */
    this.getId = function() {
        return id;
    };

    /**
     * @returns {Object} The associated asset's player
     */
    this.getPlayer = function() {
        return player;
    };

    /**
     * @type {String}
     */
    var userAgent = window.testOvvConfig && window.testOvvConfig.userAgent
        ? window.testOvvConfig.userAgent
        : navigator.userAgent
    ;

    /**
     * @type {Boolean}
     */
    var isIE11WIN81 = (function(ua) {
		var indexOfWinNT = ua.indexOf("Windows NT 6.3");
		var indexOfTrident7 = ua.indexOf("Trident/7.0");
		return indexOfTrident7 > indexOfWinNT && indexOfWinNT >= 0;
    })(userAgent);
	
	/**
     * @type {Boolean}
     */
    var isChromeOnMac = (function(ua) {
		var isChrome = ($ovv.browser.ID == $ovv.browserIDEnum.Chrome);
		var isMac = (ua.indexOf("Mac OS X") != -1);
		return isChrome && isMac;
    })(userAgent);

    ///////////////////////////////////////////////////////////////////////////
    // PRIVATE FUNCTIONS
    ///////////////////////////////////////////////////////////////////////////

    /**
     * @return {Boolean}
     */
    var isGeometryTechniqueApplicable = function() {
        return !$ovv.IN_IFRAME;
    };

    /**
     * beacon technique works in safari, chrome and IE11 on win8.1
     * @return {Boolean}
     */
    var isBeaconsTechniqueApplicable = function() {
        if('BEACON_SWF_URL' == '' || 'BEACON_SWF_URL' == "BEACON" + "_SWF_" + "URL")
            return false;

        if (!$ovv.IN_IFRAME) {
            return false;
        }

        // check if there is ie11 on win8.1
        if (isIE11WIN81 === true) {
            return true;
        }

        // firefox and ie aren't supported
        if ($ovv.browser.ID == $ovv.browserIDEnum.MSIE) {
            return false;
        }

        return true;
    };

    /**
     *
     * @param {String} left
     * @param {String} right
     * @returns {Number}
     */
    var compareVersion = function(left, right) {
        if (typeof left + typeof right != 'stringstring') {
            return NaN;
        }

        var a = left.split('.');
        var b = right.split('.');

        for (var i = 0, len = Math.max(a.length, b.length); i < len; i++) {
            if ((a[i] && !b[i] && parseInt(a[i]) > 0) || (parseInt(a[i]) > parseInt(b[i]))) {
                return 1;
            } else if ((b[i] && !a[i] && parseInt(b[i]) > 0) || (parseInt(a[i]) < parseInt(b[i]))) {
                return -1;
            }
        }

        return 0;
    };

    /**
     * Performs the geometry technique to determin viewability. First gathers
     * information on the viewport and on the player. The compares the two to
     * determine what percentage, if any, of the player is within the bounds
     * of the viewport.
     * @param {OVVCheck} check The OVVCheck object to populate
     * @param {Element} player The HTML Element to measure
     */
    var checkGeometry = function(check, player) {
        //Avoid including scrollbars in viewport size by taking the smallest dimensions (also
        //ensures ad object is not obscured)
        check.clientWidth = Infinity;
        check.clientHeight = Infinity;
        //document.body  - Handling case where viewport is represented by documentBody
        //.width
        if (!isNaN(document.body.clientWidth) && document.body.clientWidth > 0) {
            check.clientWidth = document.body.clientWidth;
        }
        //.height
        if (!isNaN(document.body.clientHeight) && document.body.clientHeight > 0) {
            check.clientHeight = document.body.clientHeight;
        }
        //document.documentElement - Handling case where viewport is represented by documentElement
        //.width
        if ( !! document.documentElement && !! document.documentElement.clientWidth && !isNaN(document.documentElement.clientWidth)) {
            check.clientWidth = document.documentElement.clientWidth;
        }
        //.height
        if ( !! document.documentElement && !! document.documentElement.clientHeight && !isNaN(document.documentElement.clientHeight)) {
            check.clientHeight = document.documentElement.clientHeight;
        }
        //window.innerWidth/Height - Handling case where viewport is represented by window.innerH/W
        //.innerWidth
        if ( !! window.innerWidth && !isNaN(window.innerWidth)) {
            check.clientWidth = Math.min(check.clientWidth,
                window.innerWidth);
        }
        //.innerHeight
        if ( !! window.innerHeight && !isNaN(window.innerHeight)) {
            check.clientHeight = Math.min(check.clientHeight,
                window.innerHeight);
        }
        if (check.clientHeight == Infinity || check.clientWidth == Infinity) {
            check = {
                "error": "Failed to determine viewport"
            };
        } else {
            //Get player dimensions:
            var objRect = player.getClientRects()[0];
            check.objTop = objRect.top;
            check.objBottom = objRect.bottom;
            check.objLeft = objRect.left;
            check.objRight = objRect.right;

            if (objRect.bottom < 0 || objRect.right < 0 ||
                objRect.top > check.clientHeight || objRect.left > check.clientWidth) {
                //Entire object is out of viewport
                check.percentViewable = 0;
            } else {
                var totalObjectArea = (objRect.right - objRect.left) *
                    (objRect.bottom - objRect.top);
                var xMin = Math.ceil(Math.max(0, objRect.left));
                var xMax = Math.floor(Math.min(check.clientWidth, objRect.right));
                var yMin = Math.ceil(Math.max(0, objRect.top));
                var yMax = Math.floor(Math.min(check.clientHeight, objRect.bottom));
                var visibleObjectArea = (xMax - xMin + 1) * (yMax - yMin + 1);
                check.percentViewable = Math.floor(visibleObjectArea / totalObjectArea * 100);
            }
        }
    };

    /**
     * Performs the beacon technique. Queries the state of each beacon and
     * attempts to make a determination of whether at least 50% of the player
     * is within the viewport.
     * @param {OVVCheck} check The OVVCheck object to populate
     */
    var checkBeacons = function(check) {

        if (!beaconsReady()) {
            return null;
        }

        var beaconsVisible = 0;
        var outerCornersVisible = 0;
        var middleCornersVisible = 0;
        var innerCornersVisible = 0;
        check.beacons = new Array(TOTAL_BEACONS);

        // Get player dimensions:
        var objRect = player.getClientRects()[0];
        check.objTop = objRect.top;
        check.objBottom = objRect.bottom;
        check.objLeft = objRect.left;
        check.objRight = objRect.right;

        for (var index = 0; index <= TOTAL_BEACONS; index++) {
            // the control beacon is only involved in determining if the
            // browser supports beacon measurement, so move on
            if (index === 0) {
                check.beacons[0] = false;
                continue;
            }

            var beacon = getBeacon(index);
            var beaconContainer = getBeaconContainer(index);
            var isViewable = beacon.isViewable();
            var onScreen = isOnScreen(beaconContainer);

            check.beacons[index] = isViewable && onScreen;

            if (isViewable) {

                beaconsVisible++;

                switch (index) {
                    case OUTER_TOP_LEFT:
                    case OUTER_TOP_RIGHT:
                    case OUTER_BOTTOM_LEFT:
                    case OUTER_BOTTOM_RIGHT:
                        outerCornersVisible++;
                        break;

                    case MIDDLE_TOP_LEFT:
                    case MIDDLE_TOP_RIGHT:
                    case MIDDLE_BOTTOM_LEFT:
                    case MIDDLE_BOTTOM_RIGHT:
                        middleCornersVisible++;
                        break;

                    case INNER_TOP_LEFT:
                    case INNER_TOP_RIGHT:
                    case INNER_BOTTOM_LEFT:
                    case INNER_BOTTOM_RIGHT:
                        innerCornersVisible++;
                        break;
                }
            }
        }

        // when all points are visible
        if (beaconsVisible === TOTAL_BEACONS) {
            return true;
        }

        var beacons = check.beacons;

        // when the center is not visible
        if (beacons[CENTER] === false) {
            // and 3 corners are visible
            if((innerCornersVisible >= 3) || (middleCornersVisible >= 3) || (outerCornersVisible >= 3))
            {
                return null;
            }
            return false;
        }

        // when the center of the player is visible

        // when 2 adjacent outside corners are visible
        if ((beacons[OUTER_TOP_LEFT] === true && beacons[OUTER_TOP_RIGHT] == true) ||
            (beacons[OUTER_TOP_LEFT] === true && beacons[OUTER_BOTTOM_LEFT] == true) ||
            (beacons[OUTER_TOP_RIGHT] === true && beacons[OUTER_BOTTOM_RIGHT] == true) ||
            (beacons[OUTER_BOTTOM_LEFT] === true && beacons[OUTER_BOTTOM_RIGHT] == true)
        ) {
            return true;
        }

        // when all of the middle corners are visible
        if (middleCornersVisible == 4) {
            return true;
        }

        // // when top left and bottom right corners are visible
        if ((beacons[OUTER_TOP_LEFT] && beacons[OUTER_BOTTOM_RIGHT]) &&
            // and any of their diagonals are covered
            (!beacons[MIDDLE_TOP_LEFT] || ![INNER_TOP_LEFT] || !beacons[CENTER] || !beacons[INNER_BOTTOM_RIGHT] || !beacons[MIDDLE_BOTTOM_RIGHT])
        ) {
            return null;
        }

        // when bottom left and top right corners are visible
        if ((beacons[OUTER_BOTTOM_LEFT] && beacons[OUTER_TOP_RIGHT]) &&
            // and any of their diagonals are covered
            (!beacons[MIDDLE_BOTTOM_LEFT] || !beacons[INNER_BOTTOM_LEFT] || !beacons[CENTER] || !beacons[INNER_TOP_RIGHT] || !beacons[MIDDLE_TOP_RIGHT])
        ) {
            return null;
        }

        return false;
    };

    /**
     * @returns {Boolean} Whether all beacons have checked in
     */
    var beaconsReady = function() {
        return player && beaconsStarted === TOTAL_BEACONS;
    };

    /**
     * Creates the beacon SWFs and adds them to the DOM
     * @param {String} url The URL of the beacon SWFs
     * @see {@link positionBeacons}
     */
    var createBeacons = function(url) {
        // double checking that our URL was actually set to something
        // (BEACON_SWF_URL is obfuscated here to prevent it from being
        // String substituted by ActionScript)
        if (url === '' || url === ('BEACON' + '_SWF_' + 'URL')) {
            return;
        }

        var html;
        var swfContainer;
        var isOldIE = $ovv.browser.ID == $ovv.browserIDEnum.MSIE && !/11.*/.test($ovv.browser.version);

        for (var index = 0; index <= TOTAL_BEACONS; index++) {

            swfContainer = document.createElement('DIV');
            swfContainer.id = 'OVVBeaconContainer_' + index + '_' + id;

            swfContainer.style.position = 'absolute';
            swfContainer.style.zIndex = $ovv.DEBUG ? 99999 : -99999;

            if (isOldIE) {
                html = '<object id="OVVBeacon_' + index + '_' + id + '" classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" width="' + BEACON_SIZE + '" height="' + BEACON_SIZE + '">' +
                    '<param name="movie" value="' + url + '" />' +
                    '<param name="quality" value="low" />' +
                    '<param name="flashvars" value="id=' + id + '&index=' + index + '" />' +
                    '<param name="bgcolor" value="#ffffff" />' +
                    '<param name="wmode" value="transparent" />' +
                    '<param name="allowScriptAccess" value="always" />' +
                    '<param name="allowFullScreen" value="false" />' +
                '</object>';
            } else {
                html = '<object id="OVVBeacon_' + index + '_' + id + '" type="application/x-shockwave-flash" data="' + url + '" width="' + BEACON_SIZE + '" height="' + BEACON_SIZE + '">' +
                    '<param name="quality" value="low" />' +
                    '<param name="bgcolor" value="#ff0000" />' +
                    '<param name="flashvars" value="id=' + id + '&index=' + index + '" />' +
                    '<param name="wmode" value="transparent" />' +
                    '<param name="allowScriptAccess" value="always" />' +
                    '<param name="allowFullScreen" value="false" />' +
                '</object>';
            }

            swfContainer.innerHTML = html;
            document.body.insertBefore(swfContainer, document.body.firstChild);
        }

        // move the beacons to their initial position
        positionBeacons.bind(this)();

        // it takes ~500ms for beacons to know if they've been moved off 
        // screen, so they're repositioned at this interval so they'll be
        // ready for the next check
        setInterval(positionBeacons.bind(this), 500);
    };

    var createFrameBeacons = function() {
        for (var index = 0; index <= TOTAL_BEACONS; index++) {
            var iframe = document.createElement('iframe');
            iframe.name = iframe.id = 'OVVFrame_' + id + '_' + index;
            iframe.width = $ovv.DEBUG ? 20 : 1;
            iframe.height = $ovv.DEBUG ? 20 : 1;
            iframe.frameBorder = 0;
            iframe.style.position = 'absolute';
            iframe.style.zIndex = $ovv.DEBUG ? 99999 : -99999;

            iframe.src = 'javascript: ' +
            'window.isInViewArea = undefined; ' +
            'window.wasInViewArea = false; ' +
            'window.isInView = undefined; ' +
            'window.wasViewed = false; ' +
            'window.started = false; ' +
            'window.index = ' + index + ';' +
            'window.isViewable = function() { return window.isInView; }; ' +
            'var cnt = 0; ' +
            'setTimeout(function() {' +
            'var span = document.createElement("span");' +
            'span.id = "ad1";' +
            'document.body.insertBefore(span, document.body.firstChild);' +
            '},300);' +
            'setTimeout(function() {setInterval(' +
            'function() { ' +
            'ad1 = document.getElementById("ad1");' +
            'ad1.innerHTML = window.mozPaintCount > cnt ? "In View" : "Out of View";' +
            'var paintCount = window.mozPaintCount; ' +
            'window.isInView = (paintCount>cnt); ' +
            'cnt = paintCount; ' +
            'if (parent.$ovv.DEBUG == true) {' +
            'if(window.isInView === true){' +
            'document.body.style.background = "green";' +
            '} else {' +
            'document.body.style.background = "red";' +
            '}' +
            '}' +
            'if (window.started === false) {' +
            'parent.$ovv.getAssetById("' + id + '")' + '.beaconStarted(window.index);' +
            'window.started = true;' +
            '}' +
            '}, 500)},400);';

            document.body.insertBefore(iframe, document.body.firstChild);
        }

        // move the frames to their initial position
        positionBeacons.bind(this)();

        // it takes ~500ms for beacons to know if they've been moved off
        // screen, so they're repositioned at this interval so they'll be
        // ready for the next check
        setInterval(positionBeacons.bind(this), positionBeaconsIntervalDelay);
    };

    /**
     * Repositions the beacon SWFs on top of the player
     */
    var positionBeacons = function() {

        if (!beaconsReady()) {
            return;
        }

        var playerLocation = player.getClientRects()[0];

        // when we don't have an initial position, or the position hasn't changed 
        if (lastPlayerLocation && (lastPlayerLocation.left === playerLocation.left && lastPlayerLocation.right === playerLocation.right && lastPlayerLocation.top === playerLocation.top && lastPlayerLocation.bottom === playerLocation.bottom)) {
            // no need to update positions
            return;
        }

        // save for next time
        lastPlayerLocation = playerLocation;

        var playerWidth = playerLocation.right - playerLocation.left;
        var playerHeight = playerLocation.bottom - playerLocation.top;

        var innerWidth = playerWidth / (1 + SQRT_2);
        var innerHeight = playerHeight / (1 + SQRT_2);

        var middleWidth = playerWidth / SQRT_2;
        var middleHeight = playerHeight / SQRT_2;

        for (var index = 0; index <= TOTAL_BEACONS; index++) {

            var left = playerLocation.left + document.body.scrollLeft;
            var top = playerLocation.top + document.body.scrollTop;

            switch (index) {
                case CONTROL:
                    left = -100000;
                    top = -100000;
                    break;
                case CENTER:
                    left += (playerWidth - BEACON_SIZE) / 2;
                    top += (playerHeight - BEACON_SIZE) / 2;
                    break;
                case OUTER_TOP_LEFT:
                    // nothing to do, already at default position
                    break;
                case OUTER_TOP_RIGHT:
                    left += playerWidth - BEACON_SIZE;
                    break;
                case OUTER_BOTTOM_LEFT:
                    top += playerHeight - BEACON_SIZE;
                    break;
                case OUTER_BOTTOM_RIGHT:
                    left += playerWidth - BEACON_SIZE;
                    top += playerHeight - BEACON_SIZE;
                    break;
                case MIDDLE_TOP_LEFT:
                    left += (playerWidth - middleWidth) / 2;
                    top += (playerHeight - middleHeight) / 2;
                    break;
                case MIDDLE_TOP_RIGHT:
                    left += ((playerWidth - middleWidth) / 2) + middleWidth;
                    top += (playerHeight - middleHeight) / 2;
                    break;
                case MIDDLE_BOTTOM_LEFT:
                    left += (playerWidth - middleWidth) / 2;
                    top += ((playerHeight - middleHeight) / 2) + middleHeight;
                    break;
                case MIDDLE_BOTTOM_RIGHT:
                    left += ((playerWidth - middleWidth) / 2) + middleWidth;
                    top += ((playerHeight - middleHeight) / 2) + middleHeight;
                    break;
                case INNER_TOP_LEFT:
                    left += (playerWidth - innerWidth) / 2;
                    top += (playerHeight - innerHeight) / 2;
                    break;
                case INNER_TOP_RIGHT:
                    left += ((playerWidth - innerWidth) / 2) + innerWidth;
                    top += (playerHeight - innerHeight) / 2;
                    break;
                case INNER_BOTTOM_LEFT:
                    left += (playerWidth - innerWidth) / 2;
                    top += ((playerHeight - innerHeight) / 2) + innerHeight;
                    break;
                case INNER_BOTTOM_RIGHT:
                    left += ((playerWidth - innerWidth) / 2) + innerWidth;
                    top += ((playerHeight - innerHeight) / 2) + innerHeight;
                    break;
            }

            // center the middle and inner beacons on their intended point
            if (index >= MIDDLE_TOP_LEFT) {
                left -= (BEACON_SIZE / 2);
                top -= (BEACON_SIZE / 2);
            }

            var swfContainer = getBeaconContainer(index);
            swfContainer.style.left = left + 'px';
            swfContainer.style.top = top + 'px';
        }
    };

    /**
     * Determines whether a DOM element is within the bounds of the viewport
     * @param {Element} element An HTML Element
     * @returns {Boolean} Whether the parameter is at least partially within
     * the browser's viewport
     */
    var isOnScreen = function(element) {
        var rect, sw, sh;

        if (!element) {
            return false;
        }

        rect = element.getClientRects()[0];

        if (!rect) {
            return false;
        }

        sw = Math.max(document.body.clientWidth, window.innerWidth);
        sh = Math.max(document.body.clientHeight, window.innerHeight);

        return (rect.top < sh && rect.bottom > 0 && rect.left < sw && rect.right > 0);
    };

    /**
     * @returns {Element|null} A beacon by its index
     * Use memoize implementation to reduce duplicate document.getElementById calls
     */
    var getBeacon = (function (index) {
        return getBeaconFunc(index);
    }).memoize();

    /**
     * @returns {Element|null} A beacon by its index
     */
    var getFlashBeacon = function (index) {
        return document.getElementById('OVVBeacon_' + index + '_' + id);
    }

    /**
     * @returns {Element|null} A beacon frame container by its index
     */
    var getFrameBeacon = function (index) {
        var frame = document.getElementById('OVVFrame_' + id + '_' + index);
        var contentWindow = null;
        if (frame) {
            contentWindow = frame.contentWindow;
        }
        return contentWindow;
    };

    /**
     * @returns {Element|null} A beacon container by its index.
     * Use memoize implementation to reduce duplicate document.getElementById calls
     */
    var getBeaconContainer = (function (index) {
        return getBeaconContainerFunc(index);
    }).memoize();

    /**
     * @returns {Element|null} A beacon container by its index
     */
    var getFlashBeaconContainer = function (index) {
        return document.getElementById('OVVBeaconContainer_' + index + '_' + id);
    };

    /**
     * @returns {Element|null} A beacon frame container by its index
     */
    var getFrameBeaconContainer = function (index) {
        return document.getElementById('OVVFrame_' + id + '_' + index);
    };

    /**
     * Finds the video player associated with this asset by searching through
     * each EMBED and OBJECT element on the page, testing to see if it has the
     * randomly generated callback signature.
     * @returns {Element|null} The video player being measured
     */
    var findPlayer = function() {
        var i, l;
        var embeds = document.getElementsByTagName('embed');

        for (i = 0, l = embeds.length; i < l; i++) {
            if (embeds[i][id]) {
                return embeds[i];
            }
        }

        var objs = document.getElementsByTagName('object');

        for (i = 0, l = objs.length; i < l; i++) {
            if (objs[i][id]) {
                return objs[i];
            }
        }

        return null;
    };

    /**
     * @return {Boolean}
     */
    var isInFocus = function() {
        var inFocus = true;

        // Opera 12.10 and Firefox 18 and later support
        // @see https://developer.mozilla.org/en-US/docs/Web/Guide/User_experience/Using_the_Page_Visibility_API
        if (typeof document.hidden !== "undefined") {
            inFocus = !document.hidden;
        } else if (typeof document['mozHidden'] !== "undefined") {
            inFocus = !document['mozHidden'];
        } else if (typeof document['msHidden'] !== "undefined") {
            inFocus = !document['msHidden'];
        } else if (typeof document['webkitHidden'] !== "undefined") {
            inFocus = !document['webkitHidden'];
        } else if (document.hasFocus) {
            inFocus = document.hasFocus();
        }

        if ($ovv.IN_IFRAME === false && inFocus === true && document.hasFocus){
            inFocus = document.hasFocus();
        }

        return inFocus;        
    };

    player = findPlayer();

    // only use the beacons if we're in an iframe, but go ahead and add them
    // during debug mode
    if (isBeaconsTechniqueApplicable() || $ovv.DEBUG) {
        // 'BEACON_SWF_URL' is String substituted from ActionScript
        if ($ovv.browser.ID === $ovv.browserIDEnum.Firefox){
            //Use frame technique to measure viewability in cross domain FF scenario
            getBeaconFunc = getFrameBeacon;
            getBeaconContainerFunc = getFrameBeaconContainer;
            createFrameBeacons.bind(this)();
        }
        else {
            getBeaconFunc = getFlashBeacon;
            getBeaconContainerFunc = getFlashBeaconContainer;
            // 'BEACON_SWF_URL' is String substituted from ActionScript
            createBeacons.bind(this)('BEACON_SWF_URL');
        }
    } else {
        // since we don't have to wait for beacons to be ready, we start the 
        // impression timer now
        if (player && player.startImpressionTimer)
            player.startImpressionTimer();
    }
}

function traceIt(msg) {
    //try {
    //    console.log(msg);
    //} catch (e) {}
}

// A memoize function to store function results
Function.prototype.memoized = function(key) {
    this._cacheValue = this._cacheValue || {};
    return this._cacheValue[key] !== undefined ?
        this._cacheValue[key] : // return from cache
        this._cacheValue[key] = this.apply(this, arguments); // call the function is not exist in cache and store in cache for next time
};

Function.prototype.memoize = function() {
    var fn = this;
    return function() {
        return fn.memoized.apply(fn, arguments);
    }
};

// initialize the OVV object if it doesn't exist
window.$ovv = window.$ovv || new OVV();

// 'OVVID' is String substituted from AS
window.$ovv.addAsset(new OVVAsset('OVVID'));
