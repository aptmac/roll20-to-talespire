const ROLL_TYPES = {
    Ability: "ability",
    Saving: "saving",
    Skill: "skill",
    Attack: "attack",
    Damage: "damage",
    Initiative: "initiative",
    HitDice: "hit_dice",
    Unsupported: "unsupported"
}

const ROLL_QUERIES = {
    Advantage: "advantage",
    Normal: "normal",
    Disadvantage: "disadvantage"
}

const ABILITY_TYPES = {
    Strength: "strength",
    Dexterity: "dexterity",
    Constitution: "constitution",
    Intelligence: "intelligence",
    Wisdom: "wisdom",
    Charisma: "charisma"
}

// Class to contain all the information relevant to a roll
class RollInformation {
    constructor(rollType, rollName, roll, modifier) {
        this.rollType = rollType;
        this.rollName = rollName;
        this.roll = roll;
        this.modifier = modifier;
        this.source = "character-sheet";
    }

    setRollQueries(rollQueries) {
        this.rollQueries = rollQueries;
    }

    setDiceResult(diceResult) {
        this.diceResult = diceResult;
    }
}

// The currently hovered button
let hoveredElement = null;

document.addEventListener('mousemove', function(e) {
    hoveredElement = e.target;
}, false);

document.addEventListener('keydown', function(e) {
    // prevents the event from firing repeatedly if the button is held
    if (e.repeat) {
        return;
    }
    if (e.shiftKey && hoveredElement != null && hoveredElement.nodeName == "BUTTON" && hoveredElement.getAttribute("type") == "roll") {
        let rollType = determineRollType(hoveredElement);
        let rollInformation;
        // Determine the roll information
        switch (rollType) {
            case ROLL_TYPES.Initiative:
                rollInformation = getInitiativeRollInformation(hoveredElement);
                break;
            case ROLL_TYPES.HitDice:
                rollInformation = getHitDiceRollInformation();
                break;
            case ROLL_TYPES.Ability:
                rollInformation = getAbilityRollInformation(hoveredElement);
                break;
            case ROLL_TYPES.Saving:
                rollInformation = getSavingThrowInformation(hoveredElement);
                break;
            case ROLL_TYPES.Skill:
                rollInformation = getSkillRollInformation(hoveredElement);
                break;
            case ROLL_TYPES.Attack:
                rollInformation = getAttackRollInformation(hoveredElement);
                break;
            case ROLL_TYPES.Damage:
                rollInformation = getDamageRollInformation(hoveredElement);
                break;
            case ROLL_TYPES.Unsupported:
                alert("The roll you have tried to use is currently unsupported.");
                return;
        }
        // Send the roll to TaleSpire
        rollInformation.rollQueries = checkRollQueries();
        if (rollInformation.rollQueries == ROLL_QUERIES.Normal) {
            window.open(`talespire://dice/${rollInformation.rollName}:${rollInformation.roll}`, "_self");
        } else {
            // advantage/disadvantage can be done with something like //dice/test:d20/test:d20 to make two rolls for the same value
            window.open(`talespire://dice/${rollInformation.rollName} at ${rollInformation.rollQueries}:${rollInformation.roll}/${rollInformation.rollName} at ${rollInformation.rollQueries}:${rollInformation.roll}`, "_self");
        }
    }
}, false);

/**
 * Identify the type of roll based on characteristics of the button
 * How to tell them apart using HTML:
 * - Ability rolls have their name end with "_${ability}"". e.g., roll_strength
 * - Saving throws have their name end with "_save". e.g., roll_strength_save
 * - Skill rolls have their data-i18n attribute end with "-core". Not all buttons have a data-i18n, so check it exists first.
 * - Attack rolls have the name "roll_attack"
 * - Damage rolls have the name "roll_dmg"
 */
function determineRollType(element) {
    let rollName = getRollNameFromString(element.getAttribute("name"));
    console.warn(rollName);
    if (rollName == "initiative") {
        return ROLL_TYPES.Initiative;
    } else if (rollName == "hit_dice") {
        return ROLL_TYPES.HitDice;
    } else if (rollName && Object.values(ABILITY_TYPES).includes(rollName)) {
        return ROLL_TYPES.Ability;
    } else if (element.getAttribute("name").endsWith("_save")) {
        return ROLL_TYPES.Saving;
    } else if (element.getAttribute("data-i18n") && element.getAttribute("data-i18n").endsWith("-core")) {
        return ROLL_TYPES.Skill;
    } else if (element.getAttribute("name") == "roll_attack") {
        return ROLL_TYPES.Attack;
    } else if (element.getAttribute("name") == "roll_dmg") {
        return ROLL_TYPES.Damage;
    } else {
        return ROLL_TYPES.Unsupported;
    }
}

/**
 * Checks if the roll is normal, or made at advantage or disadvantage
 * Note: this expects that you have the Roll Queries option on your sheet set to "Advantage Toggle".
 */
function checkRollQueries() {
    // index 0 is regular advantage toggle, index 1 is whisper advantage toggle
    let toggleDiv = document.getElementsByClassName("advantagetoggle")[0];
    let toggleInputs = toggleDiv.getElementsByTagName("input");
    let i = 0;
    for (i; i < toggleInputs.length; i++) {
        if (toggleInputs[i].checked === true) {
            break;
        }
    }
    if (i == 0) {
        return ROLL_QUERIES.Advantage;
    } else if (i == 1) {
        return ROLL_QUERIES.Normal;
    } else if (i == 2) {
        return ROLL_QUERIES.Disadvantage;
    }
}

/**
 * Given the name attribute of a roll button, return the ability/skill name
 */
function getRollNameFromString(roll) {
    let match = roll.match(/roll_(.+)/);
    if (match && match[1]) {
        return match[1]
    } else {
        return null;
    }
}

/**
 * Given a roll string (e.g., d8+3), isolate the modifier
 * Note: this uses a really simple regex, and currently expects one or many dice followed by a single modifier at the end
 */
function parseDamageRollModifier(roll) {
    let match = roll.match(/(?:d\d+\+?)+([-+]\d+)/);
    if (match && match[1]) {
        return match[1]
    } else {
        return "0";
    }
}

/**
 * Given a dice roll and a modifier, combine them into a single string
 * e.g., dice = "d20" and modifier is 3, then return d20+3
 */
function formatRollWithModifier(dice, modifier) {
    modifier = parseInt(modifier)
    if (modifier > 0) {
        return dice + "+" + String(modifier);
    } else if (modifier < 0) {
        return dice + String(modifier);
    } else {
        return dice;
    }
}

// If the modifier is not negative, pre-pend a +
function formatModifier(modifier) {
    if (parseInt(modifier) > -1 && modifier.indexOf("+") === -1) {
        modifier = "+" + modifier
    }
    return modifier;
}

/**
 * Initiative Rolls
 * name="initiative"
 */
function getInitiativeRollInformation(element) {
    let modifier = element.parentElement.getElementsByTagName("span")[0].innerText;
    return new RollInformation(ROLL_TYPES.Initiative, ROLL_TYPES.Initiative, formatRollWithModifier("d20", modifier), formatModifier(modifier));
}

/**
 * Hit Dice Rolls
 * name="hit_dice"
 */
function getHitDiceRollInformation() {
    let hitDiceValue = document.getElementsByName("attr_hitdieroll")[0].value;
    return new RollInformation(ROLL_TYPES.HitDice, ROLL_TYPES.HitDice, `d${hitDiceValue}`, 0);
}

/**
 * Ability Rolls
 * name="roll_${ability}"
 * e.g., roll_strength
 */
function getAbilityRollInformation(element) {
    let rollName = getRollNameFromString(element.getAttribute("name"));
    let modifier = element.parentElement.getElementsByTagName("span")[0].innerText;
    return new RollInformation(ROLL_TYPES.Ability, rollName, formatRollWithModifier("d20", modifier), formatModifier(modifier));
}

/**
 * Saving Throws
 * name="roll_${ability}_save"
 * e.g., roll_strength_save
 */
function getSavingThrowInformation(element) {
    let rollName = getRollNameFromString(element.getAttribute("name"));
    let modifier = element.parentElement.getElementsByTagName("span")[0].innerText;
    return new RollInformation(ROLL_TYPES.Saving, rollName, formatRollWithModifier("d20", modifier), formatModifier(modifier));
}

/**
 * Skill Rolls
 * name="roll_${skill}"
 * e.g., roll_acrobatics
 */
function getSkillRollInformation(element) {
    let rollName = getRollNameFromString(element.getAttribute("name"));
    let modifier = element.parentElement.getElementsByTagName("span")[0].innerText;
    return new RollInformation(ROLL_TYPES.Skill, rollName, formatRollWithModifier("d20", modifier), formatModifier(modifier));
}

/**
 * Attack Rolls
 * name="roll_attack"
 */
function getAttackRollInformation(element) {
    let type = element.getElementsByTagName("span")[0].innerText;
    let modifier = element.getElementsByTagName("input")[0].value;
    return new RollInformation(ROLL_TYPES.Attack, type, formatRollWithModifier("d20", modifier), formatModifier(modifier));
}

/**
 * Damage Rolls
 * name="roll_dmg"
 */
function getDamageRollInformation(element) {
    let roll = element.getElementsByTagName("input")[0].value;
    modifier = parseDamageRollModifier(roll);
    return new RollInformation(ROLL_TYPES.Damage, ROLL_TYPES.Damage, roll, modifier);
}
