"use strict";
CLAZZ("JAR.Manifest", {
    mainAttributes:null,
    entries:null,

    Entry:CLAZZ({
        key:"",
        attrs:null,
        CONSTRUCTOR:function(key, attrs){ this.key=key; this.attrs=[]; },

        stringify:function(){
            var acc = "Name: " + this.key + "\r\n";
            this.attrs.forEach( att => acc += att.key + ": " + att.value + "\r\n" );
            acc += "\r\n";
            return acc;
        },

        put:function(k, v){ this.attrs[this.attrs.length] = {key:k,value:v}; }
    }),
    
    CONSTRUCTOR:function(){
        var THIS=this;
        this.mainAttributes = [];
        this.entries = [];
        this.mainAttributes.put = function(k, v){ this[this.length] = {key:k,value:v}; }; 
        this.entries.put = function(k){ return this[this.length] = THIS.Entry.NEW(k); };
    },

    getMainAttributes:function(){
        return this.mainAttributes;
    },

    write:function(noMain){
        var acc = "", k;

        if( !noMain ){
            this.mainAttributes.forEach(att => acc += att.key + ": " + att.value + "\r\n" );
        }

        acc += "\r\n";
        
        this.entries.forEach(entry=> acc += entry.stringify() );
        
        if( !noMain ) acc += "\r\n";

        return acc;
    }

});
JAR.Manifest.prototype.toString = function(){
    return this.write();
};

CLAZZ("ETSign", {

    privateKey: (
        "MIIBVgIBADANBgkqhkiG9w0BAQEFAASCAUAwggE8AgEAAkEAoiZSqWnFDHA5sXKoDiUUO9JuL7cm/2dCck5MKumVvv+WfSg0jsovnywsFN0pifmdRSLmOdUkh0d0J+tOnSgtsQIDAQABAkEAihag5u3Qhds9BsViIUmqhZebhr8vUuqZR8cuTo1GnbSoOHIPbAgD3J8TDbC/CVqae8NrgwLp325Pem1Tuof/0QIhAN1hqft1K307bsljgw3iYKopGVZBHRXsjRnNL4edV9QrAiEAu4F+XtS1wohGLz5QtfuMFsQNo4l31mCjt6WpBDmSi5MCIQCB++YijxmJ3mueM5+vd0vqnVcTHghF5y6yB5fwuKHpIQIgInnS1Hjj2prX3MPmby+LOHxfzZvvDtnCAHhTNVWonkUCIQCvV8l+SpL6Vh1nQ/2EKFJo2dbZB3wKG/BEYsFkPFbn9w=="
    ),

    sigPrefix: atob(
        "MIIB5gYJKoZIhvcNAQcCoIIB1zCCAdMCAQExCzAJBgUrDgMCGgUAMAsGCSqGSIb3DQEHAaCCATYwggEyMIHdoAMCAQICBCunMokwDQYJKoZIhvcNAQELBQAwDzENMAsGA1UEAxMEVGVzdDAeFw0xMjA0MjIwODQ1NDdaFw0xMzA0MjIwODQ1NDdaMA8xDTALBgNVBAMTBFRlc3QwXDANBgkqhkiG9w0BAQEFAANLADBIAkEAoiZSqWnFDHA5sXKoDiUUO9JuL7cm/2dCck5MKumVvv+WfSg0jsovnywsFN0pifmdRSLmOdUkh0d0J+tOnSgtsQIDAQABoyEwHzAdBgNVHQ4EFgQUVL2yOinUwpARE1tOPxc1bf4WrTgwDQYJKoZIhvcNAQELBQADQQAnj/eZwhqwb2tgSYNvgRo5bBNNCpJbQ4alEeP/MLSIWf2nZpAix8T3oS9X2affQtAgctPATcKQaiH2B4L7FKlVMXoweAIBATAXMA8xDTALBgNVBAMTBFRlc3QCBCunMokwCQYFKw4DAhoFADANBgkqhkiG9w0BAQEFAARA"
    ),
    
    manifest:null,

    hex2bin:function(hex){
        var buff = "";
        for( var i=0; i<hex.length; i+=2 )
            buff += String.fromCharCode( parseInt(hex.substr(i, 2), 16) );
        return buff;
    },

    hash:function(d){
        return btoa( this.hex2bin(sha1(d)) );
    },

    sign:function( files ){
        this.manifest = new JAR.Manifest();
        var sha1Manifest = this.writeManifest(files);
        var sign = this.writeSF(files, sha1Manifest);
        this.writeRSA(files, sign);
    },

    writeManifest:function( files ){
        var main = this.manifest.getMainAttributes();
        main.put("Manifest-Version", "1.0");
        main.put("Built-By", "2.1.0");
        main.put("Created-By", "ETSign 2.1.0");

        this.digestFiles( files, this.manifest );
        var buffer = strToBuffer(this.manifest.toString());

        files.push({name:"META-INF/MANIFEST.MF", data: buffer });

        return this.hash(buffer);
    },

    digestFiles:function(files, m){
        files.forEach(f => {
            m.entries.put(f.name).put("SHA1-Digest", this.hash(f.data));
        });
    },

    writeSF:function( files, sha1Manifest ){
        var sf = new JAR.Manifest();
        this.manifest.entries.forEach( entry => sf.entries.put(entry.key).put( "SHA1-Digest", this.hash(entry.stringify()) ) );

        var signature = new KJUR.crypto.Signature({"alg": "SHA1withRSA"});
        var key = "-----BEGIN PRIVATE KEY-----\n" + this.privateKey + "\n-----END PRIVATE KEY-----";
        signature.init( KEYUTIL.getRSAKeyFromPlainPKCS8PEM(key) );

        var out = "Signature-Version: 1.0\r\n";
        out += "SHA1-Digest-Manifest: " + sha1Manifest + "\r\n";
        out += "Created-By: ETSign\r\n";
        out += sf.write(true);
        signature.updateString(out);
        files.push({name:"META-INF/CERT.SF", data:strToBuffer(out)});
        return this.hex2bin( signature.sign() );
    },

    writeRSA:function( files, sign ){
        var binsign = strToBuffer( sign );
        var buffer = new Uint8Array( this.sigPrefix.length + binsign.length );
        buffer.set(strToBuffer(this.sigPrefix));
        buffer.set(binsign, this.sigPrefix.length);
        files.push({name:"META-INF/CERT.RSA", data:buffer});
    }
});
