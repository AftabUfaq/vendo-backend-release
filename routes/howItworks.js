const express = require('express');
const router = express.Router();
const HowItWorks = require("../lists/HowItWorks");

// Create a new HowItWorks entry
router.post('/', async (req, res) => {
    try {
        const newContent = new HowItWorks(req.body);
        const savedContent = await newContent.save();
        res.status(201).json(savedContent);
    } catch (err) {
        res.status(400).json({ message: 'Error creating content', error: err.message });
    }
});

// Get all HowItWorks entries
router.get('/', async (req, res) => {
    try {
        const contents = await HowItWorks.find();
        res.status(200).json(contents);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching content', error: err.message });
    }
});

// Get a specific HowItWorks entry by ID
router.get('/:id', async (req, res) => {
    try {
        const content = await HowItWorks.findById(req.params.id);
        if (!content) {
            return res.status(404).json({ message: 'Content not found' });
        }
        res.status(200).json(content);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching content', error: err.message });
    }
});

// Update a specific HowItWorks entry by ID
router.put('/:id', async (req, res) => {
    try {
        const updatedContent = await HowItWorks.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!updatedContent) {
            return res.status(404).json({ message: 'Content not found' });
        }
        res.status(200).json(updatedContent);
    } catch (err) {
        res.status(400).json({ message: 'Error updating content', error: err.message });
    }
});

// Delete a specific HowItWorks entry by ID
router.delete('/:id', async (req, res) => {
    try {
        const deletedContent = await HowItWorks.findByIdAndDelete(req.params.id);
        if (!deletedContent) {
            return res.status(404).json({ message: 'Content not found' });
        }
        res.status(200).json({ message: 'Content deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting content', error: err.message });
    }
});

module.exports = router;
