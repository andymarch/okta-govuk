const axios = require('axios')
const crypto = require('crypto')

    async function isPwnedPassword(password){
        shasum = crypto.createHash('sha1');
        shasum.update(password);
        shahex = shasum.digest('hex');
        prefix = shahex.substring(0,5)
        suffix = shahex.substring(5);

        var hibpResponse = await axios.get( 
            'https://api.pwnedpasswords.com/range/'+prefix,
        );

        var pattern = new RegExp("("+suffix.toUpperCase()+"):([0-9]+)","g")
        match = pattern.exec(hibpResponse.data)
        if(match != null){
            console.log(match[2])
            return match[2]
        }
        else return 0
    }

module.exports = {isPwnedPassword}