exports.saveFcmToken = async (req, res) => {
  try {
    req.user.fcmToken = req.body.fcmToken;
    await req.user.save();
    res.status(200).json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: "Failed to save FCM token" });
  }
};

exports.getUserProgress = async (req, res) => {
  try {
    const user = req.user;
    res.status(200).json({ success: true, data: user.progress });
  } catch (e) {
    res.status(500).json({ success: false, message: "Failed to fetch progress" });
  }
};