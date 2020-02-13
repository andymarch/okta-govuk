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
        if(hibpResponse.data.includes(suffix.toUpperCase() )){
            return true;
        }
        else{
            return false;
        }
    }

module.exports = {isPwnedPassword}