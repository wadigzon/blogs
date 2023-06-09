const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());
app.use(cors());

const posts = {};

// QUICK EXAMPLE
/**
posts === {
    'j123j42': {
        id: 'j123j42',
        title: 'post title',
        comments: [
            { id: 'klj3kl', content: 'comment!' }
        ]
    },
    'k123k42': {
        id: 'k123k42',
        title: 'post title1',
        comments: [
            { id: 'klp3kp', content: 'comment1!' }
        ]
    }
}
 */

app.get('/posts', (req, res) => {
    res.send(posts);
});

const handleEvent = (type, data) => {
    if (type === 'PostCreated') {
        const { id, title } = data;
        posts[id] = {id, title, comments: []};
    }

    if (type === 'CommentCreated') {
        const {id, content, postId, status } = data;
        const post = posts[postId];
        post.comments.push({id, content, status })
    }

    if (type === 'CommentUpdated') {
        const { id, content, postId, status } = data;
        const post = posts[postId];
        const comment = post.comments.find( comment => comment.id === id);
        comment.status = status;
        comment.content = content;
    }
}

app.post('/events', (req, res) => {
    const { type, data } = req.body;

    handleEvent(type, data);

    //console.log(posts);
    res.send({});
});

app.listen(4002, async () => {
    console.log('listening on 4002');
    try {
        const res = await axios.get('http://localhost:4005/events');

        for (let event of res.data) {
            console.log('Processing event:', event.type);
            handleEvent(event.type, event.data);
        }
    } catch (error) {
        console.log(error.message);
    }
});