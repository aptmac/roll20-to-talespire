// Fetch the input data from the popup and send it to TaleSpire
document.getElementById("submitButton").addEventListener("click", async function() {
    let roll = document.getElementById("rollInput").value
    roll = roll.replace(/\s/g, ''); // TaleSpire does not like whitespaces in dice roll strings
    let rollName = document.getElementById("rollNameInput").value || `${roll}`;

    // Takes a look at the advantage toggles and determines what the roll query is
    let rollQuery;
    let isAdvantage = document.getElementById("advantageCheck").checked;
    let isDisadvantage = document.getElementById("disadvantageCheck").checked;
    if (isAdvantage && !isDisadvantage) {
        rollQuery = "advantage";
    } else if (!isAdvantage && isDisadvantage) {
        rollQuery = "disadvantage";
    } else {
        rollQuery = "normal"
    }

    // Send the roll to TaleSpire
    if (rollQuery == "normal") {
        window.open(`talespire://dice/${rollName}:${roll}`, "_self");
    } else {
        window.open(`talespire://dice/${rollName} at ${rollQuery}:${roll}/${rollName} at ${rollQuery}:${roll}`, "_self");
    }
});
