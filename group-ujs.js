function group_access() {
    // Make a POST request to fetch data from the GraphQL API using jQuery
    $.post('https://portal.thinktribe.com/api/private', {
            query: `
          query {
            userJourneys(scriptClientFolder: "accessgroup") {
              ujID
              group
              name
            }
          }
        `
        }, function(data) {
            // Group user journeys by their group
            const groupedJourneys = {};
            data.data.userJourneys.forEach(journey => {
                const {
                    group,
                    ujID,
                    name
                } = journey;
                if (group !== null) {
                    if (!groupedJourneys[group]) {
                        groupedJourneys[group] = [];
                    }
                    groupedJourneys[group].push({
                        ujID,
                        name
                    });
                }
            });

            // Sort user journeys within each group by their name
            Object.values(groupedJourneys).forEach(journeys => {
                journeys.sort((a, b) => a.name.localeCompare(b.name));
            });

            // Get the <tbody> element
            const tbody = $('tbody[customerid="11018"]');

            // Loop through each group and insert user journey rows into the tbody
            Object.entries(groupedJourneys).forEach(([group, journeys]) => {
                // Insert the group name row at the end of the tbody
                tbody.append(`<tr class="folder live grouped">
                          <td class="bold nobottom">${group}</td>
                          <td class="nobottom" colspan="11">&nbsp;</td>
                        </tr>`);

                // Move each journey row, inserting it at the bottom of the tbody
                journeys.forEach(journey => {
                    const journeyRow = $(`#TR-${journey.ujID}`);
                    if (journeyRow.length && !journeyRow[0].classList.contains('staging')) {
                        tbody.append(journeyRow);
                    }
                });
            });
        })
        .fail(function(error) {
            console.error('Error fetching or processing data:', error);
        });
}

$(document).ready(function() {
    const tbody = $('tbody[customerid="11018"]');
    if (tbody.length == 1) {
        $.ajax({
            url: window.location.origin + "/api/private",
            method: "POST",
            data: JSON.stringify({
                query: `
                query{
                    currentUser{
                        customer{
                          customerID
                        }
                      }
                }`
            }),
            contentType: "application/json",
            success: function(json_data) {
                if (json_data['data']['currentUser']['customer']['customerID'] === 1) {
                    group_access();
                }
            }
        });
    }
});