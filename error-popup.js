
let popup_div = $(document.createElement("div"));
popup_div.attr("id", "errorPopupDiv");
popup_div.css("width", "420px");

popup_div.hoverIntent({
    "interval": 0,
    "timeout": 500,
    "out": function() {
        popup_div.html("");
        popup_div.css("display", "none");
        popup_div.css("left", "");
        popup_div.css("top", "");
    },
    "over": function() {}
});

$("body").append(popup_div);

function render(json_response){
    const sample = json_response['data']['userJourney']['sample'];
    const injector = sample['injector'];
    const status = sample['status'];
    const errorCauses = sample['errorCauses'];
    const steps = sample['steps'];
    const sampletime = moment.tz(sample['sampleTime'], "Europe/London").format("dddd Do MMMM, HH:mm:ss");
    const isSlow = (status === "SLOW");

    for (let i = 0; i < errorCauses.length; i++) {
        const number = errorCauses[i]['stepNumber'];
        errorCauses[i]['stepName'] = steps.filter(
            function(item) {
                return item.number === number
            }
        ).map(
            function(item) {
                return item.name
            }
        );
    }

    popup_div.html(`
        <div id="errors" style="word-wrap: break-word; padding: 10px; overflow-y: scroll; max-height: 300px;">
            <span style="font-weight: bold;">Sample Time: </span>${sampletime}
            <br>
            <br>
            <span style="font-weight: bold;">Status: </span>
            <span class="status ${status}_status">${status}</span>
            <br>
            <br>
            <span style="font-weight: bold;">Injector: </span>${injector}
            <br>
            <br>
            ${errorCauses.map((error) => `
                <div style="margin-bottom: 2px;" class="${error.status}">
                    <span style="font-weight:bold">Cause: </span>
                    <br>
                    ${error.message}
                    <br>
                    ${isSlow ? '' :
                        `<span style="font-weight:bold">Step ${error.stepNumber}:  </span>
                        <br>
                        ${error.stepName}
                        <br>
                        <span style="font-weight:bold">Component:  </span>
                        <br>
                        ${error.url}
                        <br>`
                    }
            </div>
            `
            ).join('')}
        </div>
        `
    );
}

function on_hover() {
    const offset = $(this).offset();
    const posY = offset.top + $(this).height();
    const window_width = $(document).width() - 50;
    let posX = offset.left;
    if (posX + 420 > window_width) {
        posX = posX - 420;
    }

    let url = this.href.animVal;
    let uj_id, sample_time, backup;

    const params = new URLSearchParams(url.split('?')[1]);

    backup = JSON.parse(params.get('backup').toLowerCase());
    uj_id = parseInt(params.get('uj'));
    sample_time = params.get('sampleTime').replace('+', ' ').replace('%3A', ':').replace('%3A', ':');

    const utc_sample_time = moment.tz(sample_time, "Europe/London").format();

    $.ajax({
        url:  window.location.origin + "/api/private",
        method: "POST",
        data: JSON.stringify({
            query: `query ($ujId: Int!, $sampleTime: DateTime!, $backup: Boolean!) {
                userJourney (ujId: $ujId) {
                    sample (sampleTime: $sampleTime, backup: $backup) {
                        sampleTime
                        injector
                        status
                        errorCauses {
                            message,
                            stepNumber,
                            url,
                            status
                        }
                        steps {
                            number
                            name
                        }
                    }
				}
			}`,
            variables: {
                "ujId": uj_id,
                "sampleTime": utc_sample_time,
                "backup": backup
            }
        }),
        contentType: "application/json",
        success: function(json_data) {
            render(json_data);
            popup_div.css("left", posX);
            popup_div.css("top", posY);
            popup_div.css("display", "block");
        }
    });
}

hoverIntentCfg = {
    "over": on_hover,
    "out": function() {
    	if (!popup_div.is(":hover")) {
            popup_div.html("");
            popup_div.css("display", "none");
            popup_div.css("left", "");
            popup_div.css("top", "");
        }
    },
    "timeout": 500,
    "interval": 750
};

function add_hovers(elem) {
    // Get all the svgs for error/warning/slow/debug status
    $(elem.querySelectorAll('rect.error, rect.warning, rect.slow, rect.debug')).each(function(i) {
        // Hover needs to be added on the a tag above the svg
        const parent = this.parentElement;
        // And add the hover
        $(parent).hoverIntent(hoverIntentCfg);
    });
}


$(document).ready(function() {
    // For all the status bar containers
    $(".statusBarContainer").each(function(i) {
        // Add the initial hover
        add_hovers(this);

        // Watch the svg for changes (when the page auto updates), and add the hover onto the newly drawn bar
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                add_hovers(mutation.target);
            });
        })
        observer.observe(this, {
            attributes: true,
            childList: true,
            characterData: true
        });

    });
});

$.fx.off = true;
