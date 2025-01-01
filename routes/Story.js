const express = require("express");
const router = express.Router();
const FileUploadService = require("../services/s3-service");
var ObjectId = require("mongodb").ObjectId;
const multer = require('multer');
const Story = require("../lists/Story");
const fileUploadService = new FileUploadService();
const mongoose = require("mongoose");
const moment = require("moment");

const upload = multer({ limits: { fileSize: 500 * 1024 * 1024 } });


function isAuthenticated(req, res, next) {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Access Denied" });

  try {
    const decoded = jwt.verify(token, "67TYGHRE99UISFD890U43JHRWERTYDGH");

    console.log(decoded);

    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ message: "Invalid Token" });
  }
}

router.get("/", async (req, res) => {
  return res.json({ stories: "stories here" });
})

// Create story
router.post("/create", async (req, res) => {
  try {
    const { mediaUrl, mediaType, providerId } = req.body;

    const story = await Story.create({
      user: providerId,
      mediaUrl,
      mediaType,
    });

    res.status(201).json({ message: "Story created", story });
  } catch (error) {
    res.status(500).json({ error: "Error creating story" });
  }
});


router.post('/upload/video', upload.single('video'), async (req, res) => {
  try {
    const videoFile = req.file;
    const providerId = req.body.providerId;
    if (!videoFile) {
      return res.status(400).json({
        status: false, message: "No File Provided"
      })
    }
    const videoUrl = await fileUploadService.uploadFile(videoFile);
    const story = await Story.create({
      user: providerId,
      mediaUrl: videoUrl,
      mediaType: "video",
    });

    res.status(201).json({ message: "Story created", story });
  } catch (error) {

    res.status(500).json({
      status: false, message: "There is an issue in staatuss uploading"
    });
  }
});

router.post("/upload/image", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: false, message: "No File Provided"
      })
    }

    const fileUrl = await fileUploadService.uploadFile(req.file);
    const story = await Story.create({
      user: providerId,
      mediaUrl: fileUrl,
      mediaType: "video",
    });

    res.status(201).json({ message: "Story created", story });
    res.json({ status: false, message: "File uploaded successfully", url: fileUrl });
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({ error: "Failed to upload file" });
  }
})
// Like a story
router.post("/like/:storyId", isAuthenticated, async (req, res) => {
  try {
    const { storyId } = req.params;
    const userId = req.user._id;

    const story = await Story.findById(storyId);
    if (!story) return res.status(404).json({ error: "Story not found" });

    // Check if the user already liked the story
    const alreadyLiked = story.likes.some(
      (like) => like.userId.toString() === userId.toString()
    );

    if (!alreadyLiked) {
      story.likes.push({ userId });
      await story.save();
      res
        .status(200)
        .json({ message: "Story liked", likes: story.likes.length });
    } else {
      res.status(400).json({ message: "User has already liked this story" });
    }
  } catch (error) {
    res.status(500).json({ error: "Error liking story" });
  }
});




router.get("/feed", async (req, res) => {
  try {
    const stories = await Story.find({
      createdAt: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    }).populate("user", "providerName logo");

    var hostname = req.headers.host
    // Group stories by provider
    const groupedStories = stories.reduce((acc, story) => {
      const { user } = story;
      const providerId = user._id.toString();


      if (!acc[providerId]) {
        acc[providerId] = {
          id: providerId,
          username: user.providerName,
          title: user.providerName,
          profile: 'https://' + hostname + user.logo.url,
          stories: [],
        };
      }


      acc[providerId].stories.push({
        id: story._id.toString(),
        storyId: story._id.toString(),
        duration: story.mediaType === "video" ? 30:15,
        isReadMore: false,
        isSeen: false,
        url: story.mediaUrl,
        ...(story.mediaType === "video" ? { type: "video" } : { type: "image" }),
      });

      return acc;
    }, {});


    const formattedStories = Object.values(groupedStories);

    res.status(200).json({ stories: formattedStories });
  } catch (error) {
    console.log(error);

    res.status(500).json({ error: "Error fetching stories feed" });
  }
});


router.get("/feed2", async (req, res) => {
  try {
    const user_id = req.query.user_id
    const stories = await Story.find({
      createdAt: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    }).populate("user", "providerName logo");

    var hostname = req.headers.host
    // Group stories by provider
    const groupedStories = stories.reduce((acc, story) => {
      const { user } = story;
      const providerId = user._id.toString();


      if (!acc[providerId]) {
        acc[providerId] = {
          id: providerId,
          username: user.providerName,
          title: user.providerName,
          profile: 'https://' + hostname + user.logo.url,
          stories: [],
        };
      }


      acc[providerId].stories.push({
        id: story._id.toString(),
        storyId: story._id.toString(),
        duration: story.mediaType === "video" ? 30:15,
        isReadMore: false,
        totalViews:story.views.length,
        isSeen: story.views.some(item => item.userId.toString() === user_id.toString()),
        url: story.mediaUrl,
        ...(story.mediaType === "video" ? { type: "video" } : { type: "image" }),
      });

      return acc;
    }, {});


    const formattedStories = Object.values(groupedStories);

    res.status(200).json({ stories: formattedStories });
  } catch (error) {
    console.log(error);

    res.status(500).json({ error: "Error fetching stories feed" });
  }
});


// Mark story as viewed
router.post("/view", async (req, res) => {
  try {
    const { storyId, userId } = req.query;

    const story = await Story.findById(storyId);
    if (!story) return res.status(404).json({ error: "Story not found" });

    const hasViewed = story.views.some(
      (view) => view.userId.toString() === userId.toString()
    ); 
    if (!hasViewed) {
      story.views.push({ userId: userId });
      await story.save();
      res.status(200).json({ message: "Story viewed" });
    } else {
      res.status(200).json({ message: "Already viewed" });
    }
  } catch (error) {
    res.status(500).json({ error: "Error viewing story" });
  }
});


router.post("/upload/story", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: false, message: "No File Provided"
      })
    }
    if (!req.body.providerId) {
      return res.status(400).json({
        status: false, message: "Provider Id is required"
      })
    }

    if (!req.body.mediaType) {
      return res.status(400).json({
        status: false, message: "Media Type is required"
      })
    }

    const providerId = req.body.providerId;
    const mediaType = req.body.mediaType
    const fileUrl = await fileUploadService.uploadFile(req.file);
    const story = await Story.create({
      user: providerId,
      mediaUrl: fileUrl,
      mediaType: mediaType,
    });
    res.status(201).json({ status: true, message: "Story created", story });
  } catch (error) {
    res.status(500).json({ status: false, message: "Failed to upload file", errorMessage: JSON.stringify(error) });
  }
})

router.get("/getProviderStories/:providerId", async (req, res) => {
  try {
    const { providerId } = req.params;

    // Validate if providerId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(providerId)) {
      return res.status(400).json({
        status: false,
        message: "Invalid provider ID format",
        stories: [],
      });
    }

    // Fetch all stories where the user matches providerId
    const stories = await Story.find({ user: providerId }).sort({ createdAt: -1 }).populate("user", "providerName logo.url");

    if (stories.length === 0) {
      return res.status(404).json({
        status: false,
        message: "No stories found for the given provider",
        stories: [],
      });
    }
    var hostname = req.headers.host
    let formatedStories = stories.map((story) => {
      return {
        id: story._id.toString(),
        storyId: story._id.toString(),

        mediaType: story.mediaType,
        mediaUrl: story.mediaUrl,
        title: story.mediaType === "video" ? "Video" : "Image",
        views: story.views.length,
        providerName: story.user.providerName,
        providerId: story.user._id.toString(),
        providerLog: `https://${hostname}${story.user.logo.url}`,
        createdAt: story.createdAt,
      }

    });


    res.status(200).json({
      status: true,
      message: "Stories fetched successfully",
      stories: formatedStories,
    });
  } catch (error) {
    console.error("Error fetching provider stories:", error); // Log the error for debugging
    res.status(500).json({
      status: false,
      message: "Error fetching stories feed",
      stories: [],
    });
  }
});

router.delete("/deleteStory/:storyId", async (req, res) => {
  try {    
    const { storyId } = req.params;
    const story = await Story.findById(storyId);
    if (!story) return res.status(404).json({ error: "Story not found" });
    await Story.findByIdAndDelete(storyId);
    res.status(200).json({status: true,  message: "Story deleted" });
  } catch (error) {
    res.status(500).json({status: false, error: "Error deleting story" });
  }
});

router.put("/updateTime/:storyId", async (req, res) => {
  try {    
    const { storyId } = req.params;
    const story = await Story.findById(storyId);
    if (!story) return res.status(404).json({ error: "Story not found2",storyId });
    await Story.findByIdAndUpdate(storyId, { createdAt:Date.now() });
    res.status(200).json({status: true,  message: "Story Time Updated" });
  } catch (error) {
    res.status(500).json({status: false, error: "Error updting story", errorMessage:error });
  }
});

module.exports = router;
