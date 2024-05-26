const jwt = require('jsonwebtoken');
require('dotenv').config();

const generateToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
};

const verifyToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
};

// Generate access and refresh tokens
function generateTokens(user) {
    const accessToken = jwt.sign({
        userId: user.id,
        username: user.username,
        role: user.role,
        barangay_id: user.barangay_id,
    }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign({
        userId: user.id,
        username: user.username,
        role: user.role,
        barangay_id: user.barangay_id,
    }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });

    return { accessToken, refreshToken };
}

module.exports = {
    generateToken,
    verifyToken,
    generateTokens,
};