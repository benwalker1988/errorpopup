/*console.log("Hello Top");

function add_hover() {
    $('rect.error, rect.warning, rect.slow, rect.debug').each(function(i) {
        var parent = $(this).parentElement;
        $(parent).hover(
            function() {
                console.log("IN on " + $(this))
            },
            function() {
                console.log("OUT on " + $(this));
            }
        );
    });
}

function new_render(args) {
    console.log("Calling new render");
    sv.wallboard.renderBarInContainer_orig(args);
    add_hover()
}

$(document).ready(function() {
    console.log("READY");
    window.sv.wallboard.renderBarInContainer_orig = window.sv.wallboard.renderBarInContainer;
    window.sv.wallboard.renderBarInContainer = new_render;
});

console.log("Hello");
*/

var s = document.createElement('script');
s.src = chrome.runtime.getURL('hover.js');
s.onload = function() {
    this.remove();
};
(document.head || document.documentElement).appendChild(s);
