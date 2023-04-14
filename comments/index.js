const express = require('express');
const bodyParser = require('body-parser');
const { randomBytes } = require('crypto');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());
app.use(cors());

const commentsByPostId = {};

app.get('/posts/:id/comments', (req, res) => {
    res.send(commentsByPostId[req.params.id] || []);
});

app.post('/posts/:id/comments',async (req, res) => {
    // generate a new comment id
    const commentId = randomBytes(4).toString('hex');
    // get content for new comment
    const { content } = req.body;
    // find existing list for that post id
    const comments = commentsByPostId[req.params.id] || [];
    // add the new comment to the list
    comments.push({ id: commentId, content: content, status: 'pending' });
    // set the commends for that post
    commentsByPostId[req.params.id] = comments;

    await axios.post('http://localhost:4005/events', {
        type: 'CommentCreated',
        data: {
            id: commentId,
            content,
            postId: req.params.id,
            status: 'pending'
        }
    })
    // return the new list of comments
    res.status(201).send(comments);
})

app.post('/events', async (req, res) => {
    console.log('Received event', req.body.type);
    const { type, data } = req.body;
    if (type === 'CommentModerated') {
        const { postId, id, status, content } = data;
        const comments = commentsByPostId[postId];
        // find such a comment
        const comment = comments.find( comment => comment.id === id );
        // update status (of reference)
        comment.status = status;
        // fire event
        await axios.post('http://localhost:4005/events', {
            type: 'CommentUpdated',
            data: {
                id,
                status,
                postId,
                content
            }
        })
    }

    res.send({});
})

app.listen(4001, () => {
    console.log('listening on 4001')
})