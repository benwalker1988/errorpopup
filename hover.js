
// create singular div element, where the content will be replaced
var content_div = document.createElement("div");
var jq_div = $(content_div);
jq_div.attr("id", "errorPopupDiv");
jq_div.css("width", "420px");

// Just need to make this hide when we mouse out for long enough
jq_div.hoverIntent({
	"interval": 0,
	"timeout": 500,
	"out": 
		function() {
            jq_div.html("");
			jq_div.css("display", "none");
			jq_div.css("left", "");
			jq_div.css("top", "");
		},
	"over": function() {}
});

$("body").append(jq_div);

function render(json_response){
    var sample = json_response['data']['userJourney']['sample'];
	var injector = sample['injector'];
	var status = sample['status'];
	var errorCauses = sample['errorCauses'];
	var steps = sample['steps'];
    var sampletime = moment.tz(sample['sampleTime'], "Europe/London").format("dddd Do MMMM, HH:mm:ss");
	const isSlow = (status === "SLOW");

	for (var i = 0; i < errorCauses.length; i++) {
		var number = errorCauses[i]['stepNumber'];
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

	jq_div.html(`
		<style>
		.WARNING {
			border: 2px solid gold;
			margin-bottom: 2px;
			padding: 5px;
		}
		.ERROR {
			border: 2px solid red;
			margin-bottom: 2px;
			padding: 5px;
		}
		.SLOW {
			border: 2px solid rgb(128, 0, 128);
			margin-bottom: 2px;
			padding: 5px;
		}
		.DEBUG {
			border: 2px solid #6699FF;
			margin-bottom: 2px;
			padding: 5px;
		}
		.status {
			font-weight: bold;
			color: white;
		}
		.ERROR_status {
			background-color: red;
		}
		.SLOW_status {
			background-color: rgb(128, 0, 128);
		}
		.WARNING_status {
			background-color: gold;
		}
		.DEBUG_status {
			background-color: #6699FF;
		}
	</style>
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
    var offset = $(this).offset();
	var posY = offset.top + $(this).height(); //two for the border
	var window_width = $(document).width() - 50;
	var posX = offset.left;
	if (posX + 420 > window_width) {
	    posX = posX - 420;
	}

    var url = this.href.animVal;
    console.log(url);
	var params;
	var ujId, sampleTime, backup;

	params = url.split('?')[1];
	params = params.split('&');

	backup = JSON.parse(params[2].split('=')[1].toLowerCase());

	ujId = parseInt(params[0].split('=')[1]);

	sampleTime = params[1].split('=')[1].replace('+', ' ').replace('%3A', ':').replace('%3A', ':');
	var utcSampleTime = moment.tz(sampleTime, "Europe/London").format();

    $.ajax({
		url:  "https://portal.thinktribe.com/api/private",
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
				"ujId": ujId,
				"sampleTime": utcSampleTime,
				"backup": backup
			}
		}),
		contentType: "application/json",
		success: function(json_data) {
            render(json_data);
            jq_div.css("left", posX);
            jq_div.css("top", posY);
            jq_div.css("display", "block");
        }
    });
}

hoverIntentCfg = {
    "over": on_hover,
    "out": function() {
    	if (!jq_div.is(":hover")) {
            jq_div.html("");
    		jq_div.css("display", "none");
    		jq_div.css("left", "");
    		jq_div.css("top", "");
    	}
    },
    "timeout": 500,
    "interval": 750
};

function add_hovers(elem) {
    $(elem.querySelectorAll('rect.error, rect.warning, rect.slow, rect.debug')).each(function(i) {
        var parent = this.parentElement;
        $(parent).hoverIntent(hoverIntentCfg);
    });
}

$(document).ready(function() {
    $(".statusBarContainer").each(function(i) {
        add_hovers(this);
        $(this).on('DOMSubtreeModified', function(){
            add_hovers(event.target);
        });
    });
});
