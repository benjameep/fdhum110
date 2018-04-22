function fixLink(link){
    if(!link.match(/^http/)){
        link = "https://byui.brightspace.com" + link
    }
    return encodeURI(link)
}

function parseTopic(topic){
    var [,lesson,type,name,isInstructions] = topic.Title.match(/(L\d\d)(.*?)(?:\|(.*?)(- Instructions)?)?$/) || []
    if(lesson){
        return {
            lesson: lesson,
            type: type.trim(),
            name: name && name.trim(),
            isInstructions: Boolean(isInstructions),
            link: fixLink(topic.Url)
        }
    } else {
        return {
            name: topic.Title,
            type: topic.TypeIdentifier,
            link: fixLink(topic.Url)
        }
    }
}

function parseModule(module){
    var data = {
        name: module.Title,
    }
    data.assignments = Object.values(module.Topics.map(parseTopic).reduce((obj,item) => {
        obj[item.name] = obj[item.name] || {
            name:item.name,
            items:[]
        }
        if(item.isInstructions){
            obj[item.name].link = item.link
        } else {
            obj[item.name].items.push(item)
        }
        return obj
    },{}))
    data.assignments.forEach(assignment => {
        if((!assignment.link && assignment.items.length == 1 && !assignment.items[0].lesson) 
            || !assignment.name){
            assignment.link = assignment.items[0].link
            assignment.type = assignment.items[0].type
            delete assignment.items
        }
    })
    return data
}

function parseTOC(toc){
    return toc.Modules.map(week => {
        var data = {
            name: week.Title
        }
        if(week.Modules.length){
            data.sections = week.Modules.map(parseModule)
            data.assignments = data.sections.shift().assignments
            data.link = data.assignments.splice(data.assignments.findIndex(assignment => assignment.items && assignment.items[0].type == "Overview"),1)[0].items[0].link
        } else {
            data = parseModule(week)
        }
        return data
    })
}


var xhttp = new XMLHttpRequest();
xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
        var body = JSON.parse(xhttp.responseText);
        var weeks = parseTOC(body)
        console.log('var data = '+JSON.stringify(weeks))
    }
};
xhttp.open("GET", "/d2l/api/le/1.24/411047/content/toc", true);
xhttp.send();
