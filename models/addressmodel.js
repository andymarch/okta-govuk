class AddressModel {

    line1 = ""
    line2 = ""
    city = ""
    county = ""
    postcode = ""
    country = ""
    
    constructor(stringVal) {
        if(stringVal){
            var result = stringVal.match("(?<line1>.*)->(?<line2>.*)->(?<city>.*)->(?<county>.*)->(?<postcode>.*)->(?<country>.*)")
            this.line1 = result.groups.line1
            this.line2 = result.groups.line2
            this.city = result.groups.city
            this.county = result.groups.county
            this.postcode = result.groups.postcode
            this.country = result.groups.country
        }
    }

    forStorage(){
        return this.line1 + "->" + this.line2 + "->" + this.city + "->" + this.county + "->" + this.postcode + "->" + this.country
    }

    forDisplay(){
        return this.line1 + ", " + this.line2 + ", " + this.city + ", " + this.county + ", " + this.postcode + ", " + this.country
    }
}

module.exports = AddressModel