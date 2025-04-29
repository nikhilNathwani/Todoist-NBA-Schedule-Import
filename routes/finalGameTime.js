const express = require("express");
const router = express.Router();
const { getFinalGameTime } = require('../utils/parseSchedule');


router.get("/finalGameTime", async (req, res) => {
	try {
		const finalGameTime = await getFinalGameTime();
		console.log(`Final game time: ${finalGameTime}`);
		res.json(finalGameTime.toISOString());
	} catch (err) {
		console.error("Error retrieving final game time:", err);
		res.status(500).json({ error: "Failed to get final game time" });
	}
});


module.exports = router;
