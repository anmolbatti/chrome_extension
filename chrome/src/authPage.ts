// navigation.addEventListener('navigate', () => {
console.log('Running authPage.ts');
const pastePerfectUrl = 'https://pasteperfect.ai';
if (window.location.href.startsWith(pastePerfectUrl) || window.location.href.startsWith('http://localhost:4200')) {
   console.log('Running authPage.ts 2');
    setTimeout(() => {
        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
        console.log('loggedInUser', loggedInUser);
        if (loggedInUser?.sessionToken) {
            chrome.runtime.sendMessage({ action: 'userloggedin', data: loggedInUser });
        }
    }, 500);
}
// })
