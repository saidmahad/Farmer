// public/js/nav.js
// Renders the top navigation bar consistently across pages.

function renderNav(mountId) {
  const mount = document.getElementById(mountId);
  if (!mount) return;

  const user = Auth.getUser();
  const loggedIn = Auth.isLoggedIn();

  mount.innerHTML = `
    <a class="brand" href="${loggedIn ? '/crops.html' : '/index.html'}">
      <span class="brand-mark" aria-hidden="true"></span>
      Beeraha
    </a>
    <div class="nav-actions">
      ${loggedIn
        ? `<span class="nav-user">${user ? escapeHtml(user.name) : ''}</span>
           <button class="btn btn-outline" id="logoutBtn">Log out</button>`
        : `<a class="btn btn-outline" href="/register.html">Sign up</a>
           <a class="btn btn-primary" href="/index.html">Sign In</a>`
      }
    </div>
  `;

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      Auth.clearSession();
      window.location.href = '/index.html';
    });
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
