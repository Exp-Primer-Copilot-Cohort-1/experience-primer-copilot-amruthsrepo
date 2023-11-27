// Create web server
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { randomBytes } = require('crypto');
const axios = require('axios');

// Create express application
const app = express();

// Parse the request body
app.use(bodyParser.json());

// Enable CORS
app.use(cors());

// Create comments object
const commentsByPostId = {};

// Create route for GET request
app.get('/posts/:id/comments', (req, res) => {
    // Send back comments array for this post id
    res.send(commentsByPostId[req.params.id] || []);
});

// Create route for POST request
app.post('/posts/:id/comments', async (req, res) => {
    // Create a random id for this comment
    const commentId = randomBytes(4).toString('hex');
    // Get the comment from the request body
    const { comment } = req.body;
    // Get the comments array for this post id
    const comments = commentsByPostId[req.params.id] || [];
    // Add the new comment to the comments array
    comments.push({ id: commentId, comment, status: 'pending' });
    // Update the comments array for this post id
    commentsByPostId[req.params.id] = comments;
    // Send back the updated comments array
    await axios.post('http://localhost:4005/events', {
        type: 'CommentCreated',
        data: {
            id: commentId,
            comment,
            postId: req.params.id,
            status: 'pending'
        }
    });
    res.status(201).send(comments);
});

// Create route for POST request
app.post('/events', async (req, res) => {
    console.log('Received Event', req.body.type);
    const { type, data } = req.body;
    if (type === 'CommentModerated') {
        const { id, postId, status, comment } = data;
        const comments = commentsByPostId[postId];
        const commentToModerate = comments.find(comment => {
            return comment.id === id;
        });
        commentToModerate.status = status;
        await axios.post('http://localhost:4005/events', {
            type: 'CommentUpdated',
            data: {
                id,
                postId,
                status,
                comment
            }
        });
    }
    res.send({});
});