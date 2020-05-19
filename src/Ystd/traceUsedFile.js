(() => {
    let fs = require("fs");
    let path = require("path");
    let rtp = `d:/runTrace.json`;
    let c;
    try {
        c = JSON.parse(fs.readFileSync(rtp));
    } catch (e) {}
    if (!c || Array.isArray(c)) c = [];

    if (!c.includes(__filename)) {
        c.push(__filename);
        fs.writeFileSync(rtp, JSON.stringify(c));
    }
})();
