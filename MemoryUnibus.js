/**
 * PDP-11 Emulation for JavaScript
 */

/**
 * MemoryUnibus prototype
 *
 * This prototype provides a UNIBUS memory system.
 * @author Takashi Toyoshima <toyoshim@gmail.com>
 */
function MemoryUnibus () {
    this.rk = new DeviceRk(this);
    this.ram = new Uint16Array(65536);  // 128KB
    this.logging = false;
    for (var i = 0; i < 65536; i++)
        this.ram[i] = 0;
}

/**
 * Inherit Memory prototype.
 */
MemoryUnibus.prototype = new Memory();
MemoryUnibus.prototype.constructor = MemoryUnibus;

/**
 * Write 8-bit data to addressed memory.
 * @param address memory address to write
 * @param data data to write
 */
MemoryUnibus.prototype.writeChar = function (address, data) {
    if (this.logging)
        Log.getLog().info("WC " + Log.toOct(address, 7) + " <= $" +
                Log.toHex(data , 2));
    var result = this._read(address);
    if (result < 0)
        throw RangeError("Memory " + Log.toOct(address, 7) +
                " write not implemented.");
    if ((address & 1) == 0)
        result = (result & 0xff00) | data;
    else
        result = (result & 0x00ff) | (data << 8);
    if (!this._write(address, result))
        throw RangeError("Memory " + Log.toOct(address, 7) +
                " write not implemented.");
};

/**
 * Read 8-bit data from addressed memory.
 * @param address memory address to read
 * @return read data
 */
MemoryUnibus.prototype.readChar = function (address) {
    var result = -1;
    result = this._read(address);
    if (result >= 0) {
        if ((address & 1) == 0)
            result &= 0xff;
        else
            result = (result >> 8) & 0xff;
    }
    if (this.logging)
        Log.getLog().info("RC " + Log.toOct(address, 7) + " => $" +
                Log.toHex(result , 2));
    if (result < 0)
        throw RangeError("Memory " + Log.toOct(address, 7) +
                " read not implemented.");
    return result;
};

/**
 * Write 16-bit data to addressed memory.
 * @param address memory address to write
 * @param data data to write
 */
MemoryUnibus.prototype.writeShort = function (address, data) {
    if (this.logging)
        Log.getLog().info("WS " + Log.toOct(address, 7) + " <= $" +
                Log.toHex(data , 4));
    if ((address & 1) != 0)
        throw RangeError("Memory alignment error.");
    if (!this._write(address, data))
        throw RangeError("Memory " + Log.toOct(address, 7) +
                " write not implemented.");
};

/**
 * Read 16-bit data from addressed memory.
 * @param address memory address to read
 * @return read data
 */
MemoryUnibus.prototype.readShort = function (address) {
    var result = this._read(address);
    if (this.logging)
        Log.getLog().info("RS " + Log.toOct(address, 7) + " => $" +
                Log.toHex(result , 4));
    if ((address & 1) != 0)
        throw RangeError("Memory alignment error.");
    if (result < 0)
        throw RangeError("Memory " + Log.toOct(address, 7) +
                " read not implemented.");
    return result;
};

/**
 * Internally write 16-bit data to addressed memory.
 * @param address memory address to write
 * @param data data to write
 * @return success
 */
MemoryUnibus.prototype._write = function (address, data) {
    if (address < 0x20000) {
        this.ram[address >> 1] = data;
        return true;
    }
    if (address == 0777564) {  // DL11 Transmitter Status Register (XCSR)
        Log.getLog().warn("DL11 XCSR <= " + Log.toHex(data, 4));
        return true;
    }
    if (address == 0777566) {  // DL11 Transmitter Data Buffer Register (XBUF)
        Log.getLog().info("DL11 XBUF <= '" + String.fromCharCode(data) + "'");
        return true;
    }
    return this.rk.write(address, data);
};

/**
 * Internally read 16-bit data from addressed memory.
 * @param address memory address to read
 * @return read data (-1: failure)
 */
MemoryUnibus.prototype._read = function (address) {
    if ((0002000 <= address) &&
            (address < (0002000 + MemoryUnibus.rom.length * 2)))
        return MemoryUnibus.rom[(address - 0002000) >> 1];
    if (address < 0x20000)
        return this.ram[address >> 1];
    if (address == 0777562) {  // DL11 Receiver Data Buffer Register (RBUF)
        return 0xffff;
    }
    if (address == 0777564) {  // DL11 Transmitter Status Register (XCSR)
        return 0x0080;  // TRANSMITTER READY
    }
    return this.rk.read(address);
};

/**
 * RK boot rom from simh.
 */
MemoryUnibus.rom = [
    0042113,           /* "KD" */
    0012706, 0002000,  /* MOV #boot_start, SP */
    0012700, 0000000,  /* MOV #unit, R0        ; unit number */
    0010003,           /* MOV R0, R3 */
    0000303,           /* SWAB R3 */
    0006303,           /* ASL R3 */
    0006303,           /* ASL R3 */
    0006303,           /* ASL R3 */
    0006303,           /* ASL R3 */
    0006303,           /* ASL R3 */
    0012701, 0177412,  /* MOV #RKDA, R1        ; csr */
    0010311,           /* MOV R3, (R1)         ; load da */
    0005041,           /* CLR -(R1)            ; clear ba */
    0012741, 0177000,  /* MOV #-256.*2, -(R1)  ; load wc */
    0012741, 0000005,  /* MOV #READ+GO, -(R1)  ; read & go */
    0005002,           /* CLR R2 */
    0005003,           /* CLR R3 */
    0012704, 0002020,  /* MOV #START+20, R4 */
    0005005,           /* CLR R5 */
    0105711,           /* TSTB (R1) */
    0100376,           /* BPL .-2 */
    0105011,           /* CLRB (R1) */
    0005007            /* CLR PC */
];
