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
function ViewabilityAsset() {

    /**
     * <p>
     * OVVAsset is the entry point into OVV. To use OVVV, create an instance of
     * this object and pass in the URL of a publicly available OVVBeacon.swf.
     * </p><p>
     * OVV will then attempt to determine the viewability of the SWF it's
     * compiled into using one of two techniques:
     * </p>
     * <ol>
     * <li>
     * The "geometry technique" uses JavaScript APIs such as
     * document.body.clientWidth/Height and getClientRects() to determine
     * how much of the SWF is within the viewport of the browser. It then sets
     * OVVCheck.viewabilityState to OVVCheck.VIEWABLE or OVVCheck.UNVIEWABLE.
     * </li>
     * <li>
     * When the asset determines that it is being viewed within an iframe,
     * it will then attempt to use the "beacon technique." This technique places
     * beacon SWFs on top of the asset and leverages the ThrottleEvent
     * introduced in FlashPlayer 11 to determine whether each beacon is within
     * the browser's viewport. If the Flash Player or the browser being used
     * don't support ThrottleEvent, OVVCheck.viewabilityState will be set to
     * OVVCheck.UNMEASURABLE.
     * </li>
     * </ol>
     * <p>
     * When OVV.DEBUG (in JavaScript) is set to true, OVV will enlarge and
     * display the beacons on the page and use both techniques. OVV will then
     * also populate the OVVCheck.beaconViewabilityState and
     * OVVCheck.geometryViewabilityState properties so that the end user can
     * compare the results of each techniques.
     * </p>
     */

    ////////////////////////////////////////////////////////////
    //   CONSTANTS
    ////////////////////////////////////////////////////////////

    ////////////////////////////////////////////////////////////
    //   CONSTRUCTOR
    ////////////////////////////////////////////////////////////

    ////////////////////////////////////////////////////////////
    //   CLASS METHODS
    ////////////////////////////////////////////////////////////

    ////////////////////////////////////////////////////////////
    //   PUBLIC API
    ////////////////////////////////////////////////////////////

    /**
     * Returns an OVVCheck object which contains information about the
     * current viewability state of the asset.
     *
     * @return OVVCheck An object containing all the properties OVV was
     * able to gather from the container
     *
     * @see org.openvv.OVVCheck
     */
    this.checkViewability = function() {
        console.log("checkViewability has been called.");
    }

    ////////////////////////////////////////////////////////////
    //   EVENT HANDLERS
    ////////////////////////////////////////////////////////////

    ////////////////////////////////////////////////////////////
    //   GETTERS / SETTERS
    ////////////////////////////////////////////////////////////

	////////////////////////////////////////////////////////////
    //   PRIVATE METHODS
    ////////////////////////////////////////////////////////////
}
