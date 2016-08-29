CLAZZ("popups.signin.SignIn", {
    INJECT:{
        dialogue:INJECT("dialogues.IDialogue", {
            controller:INJECT("this"),
            cfg:{
                width:400,
                height:100,
                position:"center",
                show:true,
                hide_only:false,
                title:"Sign In"
            }
        }),

        callback:"callback"
    },

    success: false,

    $btnSignIn:{
        click:function(){
            CLAZZ.get("onlineStorage").signIn((success) => {
                this.success = success;
                this.dialogue.close();
            });
        }
    },

    $DIALOGUE:{
        close:function(){
            this.callback(this.success);
        }
    }

})
