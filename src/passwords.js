const { randomBytes, scryptSync, timingSafeEqual } = require('crypto');

function hashPassword(password) {
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(password, salt, 64).toString('hex');

    return `scrypt$${salt}$${hash}`;
}

function verifyPassword(password, storedPassword) {
    const [algorithm, salt, storedHash] = String(storedPassword).split('$');

    if (algorithm !== 'scrypt' || !salt || !storedHash) {
        return false;
    }

    const candidateHash = scryptSync(password, salt, 64);
    const savedHash = Buffer.from(storedHash, 'hex');

    if (candidateHash.length !== savedHash.length) {
        return false;
    }

    return timingSafeEqual(candidateHash, savedHash);
}

function isHashedPassword(password) {
    return String(password).startsWith('scrypt$');
}

module.exports = {
    hashPassword,
    verifyPassword,
    isHashedPassword
};
