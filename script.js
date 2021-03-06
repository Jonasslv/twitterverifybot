
const needle = require('needle');
const fs = require('fs');

var listusers = [];

try {
    // read contents of the file
    const data = fs.readFileSync('./users.csv', 'utf8');

    // split the contents by new line
    const lines = data.split(/\r?\n/);

    // print all lines
    let firstLine = true;
    lines.forEach((line) => {
        if (!firstLine) {
            let CommaPos = line.indexOf(';');
            CommaPos += (line.slice(CommaPos + 1)).indexOf(';');
            listusers.push((line.slice(CommaPos + 2)).trim());
        } else {
            firstLine = false;
        }
    });
} catch (err) {
    console.error(err);
}

const settings = JSON.parse(fs.readFileSync(`./settings.json`));

async function getRequest(endpointURL) {
    // this is the HTTP header that adds bearer token authentication
    const res = await needle('get', endpointURL, {
        headers: {
            "Authorization": `Bearer ${settings.bearer}`
        }
    })

    if (res.body) {
        return res.body;
    } else {
        throw new Error('Unsuccessful request')
    }
}

function validTwitterUser(sn) {
    return /^[a-zA-Z0-9_]{1,15}$/.test(sn);
}

(async () => {
    const baseEndpointURL = "https://api.twitter.com/2/users/by?usernames=";
    let usersLoaded = 0;
    let totalUsers = 0;
    let usersURL = ``;
    let validusers = [];
    listusers.forEach((user) => {
        usersLoaded += 1;
        totalUsers += 1;
        if(validTwitterUser(user)){
            usersURL += `${user}${(usersLoaded == 100) || (totalUsers >= listusers.length-1)? '':','}`;
        }
        if ((usersLoaded === 100) || (totalUsers >= listusers.length-1)) {
            //be sure the last character is not a comma
            let hascomma = usersURL.substring(usersURL.length,usersURL.length-1);
            if(hascomma == `,`){
                usersURL = usersURL.substring(0,usersURL.length-1);
            }
            try {
                // Make request
                getRequest(baseEndpointURL+usersURL).then((result) =>{
                    if(result.data){
                        result.data.forEach((data) => {
                            console.log(data.username);
                        });
                    }
                });
                usersLoaded = 0;
                usersURL = ``;  
            } catch (e) {
                console.log(e);
            }
        }
    });
})();
