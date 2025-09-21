let isLoading = false;

function updateCharCount() {
    const textarea = document.getElementById('message');
    const charCount = document.getElementById('charCount');
    const length = textarea.value.length;
    charCount.textContent = `${length}/280`;
    
    if (length > 240) {
        charCount.style.color = '#d32f2f';
    } else if (length > 200) {
        charCount.style.color = '#f57c00';
    } else {
        charCount.style.color = '#666';
    }
}

async function postMessage() {
    if (isLoading) return;
    
    const message = document.getElementById('message').value.trim();
    if (!message) {
        alert('Please enter a message');
        return;
    }
    
    if (message.length > 280) {
        alert('Message too long (max 280 characters)');
        return;
    }

    isLoading = true;
    const postBtn = document.getElementById('postBtn');
    postBtn.textContent = 'Posting...';
    postBtn.disabled = true;

    try {
        console.log('Posting message:', message);
        
        const response = await fetch('/api/post', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message })
        });

        const result = await response.json();
        
        if (result.success) {
            alert(`✅ ${result.message}`);
            document.getElementById('message').value = '';
            updateCharCount();
            loadPosts();
        } else {
            alert(`❌ ${result.error || 'Failed to post message'}`);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Network error. Please try again.');
    } finally {
        isLoading = false;
        postBtn.textContent = 'Post Message';
        postBtn.disabled = false;
    }
}

async function loadPosts() {
    const loadingEl = document.getElementById('loading');
    const postsEl = document.getElementById('posts');
    const emptyStateEl = document.getElementById('emptyState');
    
    loadingEl.style.display = 'inline';
    postsEl.innerHTML = '';
    emptyStateEl.style.display = 'none';

    try {
        const response = await fetch('/api/posts');
        const posts = await response.json();
        
        if (posts.length === 0) {
            emptyStateEl.style.display = 'block';
        } else {
            posts.forEach(post => {
                const postEl = document.createElement('div');
                postEl.className = 'post';
                postEl.innerHTML = `
                    <div class="post-content">${escapeHtml(post.message)}</div>
                    <div class="post-meta">
                        <span>${new Date(post.createdAt).toLocaleString()}</span>
                        <div>
                            <span class="post-source source-${post.source}">📡 ${getSourceLabel(post.source)}</span>
                            ${post.cid ? `<span style="margin-left: 10px; font-size: 12px; opacity: 0.7;">CID: ${post.cid.slice(0, 8)}...</span>` : ''}
                        </div>
                    </div>
                `;
                postsEl.appendChild(postEl);
            });
        }
    } catch (error) {
        console.error('Error loading posts:', error);
        postsEl.innerHTML = '<div style="color: white; text-align: center; padding: 20px;">❌ Failed to load posts</div>';
    } finally {
        loadingEl.style.display = 'none';
    }
}

function getSourceLabel(source) {
    switch(source) {
        case 'ipfs': return 'IPFS';
        case 'local': return 'Local';
        case 'local-fallback': return 'Cached';
        default: return 'Unknown';
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', () => {
    const textarea = document.getElementById('message');
    textarea.addEventListener('input', updateCharCount);
    updateCharCount();
    
    textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            postMessage();
        }
    });
    
    loadPosts();
});

setInterval(loadPosts, 30000);