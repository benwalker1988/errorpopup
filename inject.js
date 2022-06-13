var s = document.createElement('script');
s.src = chrome.runtime.getURL('hover.js');
s.onload = function() {
    this.remove();
};
(document.head || document.documentElement).appendChild(s);

var link = document.createElement('link');
link.rel  = 'stylesheet';
link.type = 'text/css';
link.href = chrome.runtime.getURL('hover.css');
(document.head || document.documentElement).appendChild(link);
