/**
 * PDP-11 Emulation for JavaScript
 */

/**
 * DeviceTt prototype
 *
 * This prototype provides TT device emulation.
 * @author Takashi Toyoshima <toyoshim@gmail.com>
 */
function DeviceTt (bus) {
    this.bus = bus;
    this.keycode = -1;
}

/**
 * Public constants.
 */
DeviceTt.ADDRESS_RCSR = 0777560;
DeviceTt.ADDRESS_RBUF = 0777562;
DeviceTt.ADDRESS_XCSR = 0777564;
DeviceTt.ADDRESS_XBUF = 0777566;

/**
 * Write 16-bit data to addressed memory.
 * @param address memory address to write
 * @param data data to write
 * @return success
 */
DeviceTt.prototype.write = function (address, data) {
    var result = true;
    switch (address) {
        case DeviceTt.ADDRESS_XCSR:  // TT Transmitter Status Register
            Log.getLog().warn("TT XCSR <= " + Log.toHex(data, 4));
            break;
        case DeviceTt.ADDRESS_XBUF:  // TT Transmitter Data Buffer Register
            Log.getLog().info("CONSOLE: '" + String.fromCharCode(data) + "'");
            break;
        default:
            result = false;
    }
    return result;
};

/**
 * Read 16-bit data from addressed memory.
 * @param address memory address to read
 * @return read data (-1: failure)
 */
DeviceTt.prototype.read = function (address) {
    var result = -1;

    switch (address) {
        case DeviceTt.ADDRESS_RCSR:  // TT Receiver Status Register
            result = 0x0000;
            if (this.keycode > 0)
                result |= 0x0080;
            Log.getLog().warn("TT RCSR => " + Log.toHex(result, 4) + " (Not implemented.)");
            break;
        case DeviceTt.ADDRESS_RBUF:  // TT Receiver Data Buffer Register
            result = 0xffff;
            if (this.keycode > 0) {
                result = this.keycode;
                this.keycode = -1;
            }
            Log.getLog().info("TT XBUF => " + Log.toHex(result, 4));
            break;
        case DeviceTt.ADDRESS_XCSR:  // TT Transmitter Status Register
            result = 0x0080;  // TRANSMITTER READY
            Log.getLog().warn("TT XCSR => 0x0080 (Not implemented.)");
            break;
        default:
            break;
    }
    return result;
};

/**
 * Set input keycode.
 * @param code keycode
 */
DeviceTt.prototype.set = function (code) {
    this.keycode = code;
    Log.getLog().info("TT SET <= 0x" + Log.toHex(code, 2));
};