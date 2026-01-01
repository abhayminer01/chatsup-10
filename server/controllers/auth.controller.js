const User = require("../models/user.model");

function genRandomNumber() {
  const num = Math.floor(Math.random() * 900) + 100; // 100–999
  return num;
}

const guestLogin = async (req, res) => {
    try {
        const guest_id = genRandomNumber();
        const guest = await User.create({
            email : `guest${guest_id}@gmail.com`,
            name : `Guest${guest_id}`,
            is_guest : true
        });
        req.session.user = { id : guest._id }
        res.status(200).json({ success : true, message : 'Successfully Logged in' });
    } catch (error) {
        res.status(500).json({ success : false, err : error });
    }
}

module.exports = {
    guestLogin
}