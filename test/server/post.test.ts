'use strict';

import * as supertest from 'supertest';
import { expect } from 'chai';

import site from '../../index';
import utils from '../../utils';
import { BlogPost, BlogReply } from '../../types/models';

const agent = supertest.agent(site);
const token = utils.token;

describe('Testing post-related APIs.', () => {
  let postTemplate: BlogPost = {
    date: new Date(),
    category: 'emmmm',
    slug: 'foo-bar',
    tags: ['233', '666'],
    body: [{
      title: 'foo',
      content: '{123}(666)',
      format: 'markdown',
      default: true,
      language: 'zh'
    }],
    hideOnIndex: false,
    insertCover: false,
    cover: 'https://www.ntzyz.cn/avatar.jpg',
    replies: [] as BlogReply[],
  };
  const replyTemplate = {
    user: 'foo',
    email: 'bar@foo.baz',
    site: 'localhost.localdomain',
    content: 'Fork you!',
    datetime: new Date().getTime(),
  };
  let posts: BlogPost[];
  let id: string;

  it('Fetch post list', async () => {
    const url = '/api/post';
    const response = await agent.get(url).expect(200);

    expect(response.body.status).to.be.ok;
    expect(response.body.posts).not.to.be.undefined;

    posts = response.body.posts;
  });

  it('Create new post without token', async () => {
    const url = '/api/post';
    const response = await agent.put(url).set('Content-Type', 'application/json').send(postTemplate).expect(403);

    expect(response.body.status).equal('error');
  });

  it('Create new post with valid token', async () => {
    const url = `/api/post?token=${token}`;
    const response = await agent.put(url).set('Content-Type', 'application/json').send(postTemplate).expect(200);

    expect(response.body.status).to.be.ok;
    expect(response.body.id).not.to.be.undefined;


    id = response.body.id;
  });

  it('Check if new post is created by slug', async () => {
    const url = `/api/post/by-slug/${postTemplate.slug}`;
    const response = await agent.get(url).expect(200);

    expect(response.body.status).to.be.ok;
    expect(response.body.post).not.to.be.undefined;

    Object.keys(postTemplate).forEach(key => { console.log(key);
      if (key === 'date') {
        // Date in response is a string, we need a special judge here:
        expect(new Date(response.body.post[key]).getTime()).equal(new Date(postTemplate[key]).getTime());
        return;
      } 
      else if (key === 'body') {
        // Common request will not include the syntax of the post, special judge:
        expect(response.body.post.title).equal(postTemplate[key][0].title);
        // expect(response.body.post.content).equal(postTemplate[key][0].content);
        return;
      }
      expect(response.body.post[key]).to.deep.equal((postTemplate as any)[key]);
    });
  });  

  it('Check if new post is created by id', async () => {
    const url = `/api/post/by-id/${id}/raw`;
    const response = await agent.get(url).expect(200);

    expect(response.body.status).to.be.ok;
    expect(response.body.post).not.to.be.undefined;
  });  

  it('Fetch a post by slug which dosent exist', async () => {
    const url = '/api/post/by-slug/fork-you';
    const response = await agent.get(url).expect(404);

    expect(response.body.status).equal('error');
  });  

  it('Get a post with invalid id', async () => {
    const url = '/api/post/by-id/123456/raw';
    const response = await agent.get(url).expect(500);

    expect(response.body.status).equal('error');
  });  

  it('Add a reply to one post', async () => {
    const url = `/api/post/by-slug/${postTemplate.slug}/reply`;
    const response = await agent.put(url).set('Content-Type', 'application/json').send(replyTemplate).expect(200);

    expect(response.body.status).to.be.ok;
  });

  it('Add another reply to one post', async () => {
    const url = `/api/post/by-slug/${postTemplate.slug}/reply`;
    const response = await agent.put(url).set('Content-Type', 'application/json').send(replyTemplate).expect(200);

    expect(response.body.status).to.be.ok;
  });

  it('Update the new post without token', async () => {
    const url = `/api/post/by-id/${id}`;
    const response = await agent.post(url).set('Content-Type', 'application/json').send(postTemplate).expect(403);

    expect(response.body.status).equal('error');
  });

  it('Update the new post with valid token', async () => {
    const url = `/api/post/by-id/${id}?token=${token}`;
    const response = await agent.post(url).set('Content-Type', 'application/json').send(postTemplate).expect(200);

    expect(response.body.status).to.be.ok;
  });

  it('Update the new post with valid token but invalid id', async () => {
    const url = `/api/post/by-id/233666?token=${token}`;
    const response = await agent.post(url).set('Content-Type', 'application/json').send(postTemplate).expect(500);

    expect(response.body.status).equal('error');
  });

  it('Check post rendering', async () => {
    let response;
    const url = `/api/post/by-slug/${postTemplate.slug}`;
    // Update encoding to 'html'
    postTemplate.body[0].format = 'html';
    postTemplate.body[0].content = '<!-- more --><code lang="js">\nconsole.log("hello world");</code>';
    response = await agent.post(`/api/post/by-id/${id}?token=${token}`).set('Content-Type', 'application/json').send(postTemplate).expect(200);

    response = await agent.get(url).expect(200);
    expect(response.body.status).to.be.ok;
    expect(response.body.post).not.to.be.undefined;

    // Update encoding to 'jade'
    postTemplate.body[0].format = 'jade';
    postTemplate.body[0].content = '// more \ncode(lang="js").\n  console.log("hello world");\n';
    await agent.post(`/api/post/by-id/${id}?token=${token}`).set('Content-Type', 'application/json').send(postTemplate).expect(200);

    response = await agent.get(url).expect(200);
    expect(response.body.status).to.be.ok;
    expect(response.body.post).not.to.be.undefined;

    // Update encoding to 'markdown'
    postTemplate.body[0].format = 'markdown';
    postTemplate.body[0].content = '<!-- more -->\n```js\nconsole.log("hello world");</code>\n```';
    await agent.post(`/api/post/by-id/${id}?token=${token}`).set('Content-Type', 'application/json').send(postTemplate).expect(200);

    response = await agent.get(url).expect(200);
    expect(response.body.status).to.be.ok;
    expect(response.body.post).not.to.be.undefined;
  });

  it('Delete the new post without token', async () => {
    const url = `/api/post/by-id/${id}`;
    const response = await agent.delete(url).expect(403);

    expect(response.body.status).equal('error');
  });

  it('Delete the new post with valid token', async () => {
    const url = `/api/post/by-id/${id}?token=${token}`;
    const response = await agent.delete(url).expect(200);

    expect(response.body.status).to.be.ok;
  });

  it('Create a post with hideOnIndex property', async () => {
    const url = `/api/post?token=${token}`;
    const post = Object.assign({}, postTemplate);
    
    post.hideOnIndex = true;
    post.date = new Date();
    const response = await agent.put(url).set('Content-Type', 'application/json').send(post).expect(200);

    expect(response.body.status).to.be.ok;
    expect(response.body.id).not.to.be.undefined;

    id = response.body.id;
  });

  it('Get list.', async () => {
    const url = '/api/post';
    const response = await agent.get(url).expect(200);

    expect(response.body.status).to.be.ok;
    expect(response.body.posts).not.to.be.undefined;

    (response.body.posts as BlogPost[]).forEach(post => expect(post._id).not.equals(id));

    posts = response.body.posts;
  });

  it('Delete the new post with valid token', async () => {
    const url = `/api/post/by-id/${id}?token=${token}`;
    const response = await agent.delete(url).expect(200);

    expect(response.body.status).to.be.ok;
  });

});