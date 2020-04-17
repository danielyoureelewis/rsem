//Daniel Lewis 2020
'use strict';
function copyDivToClipboard() {
    var range = document.createRange();
    range.selectNode(document.getElementById("code"));
    window.getSelection().removeAllRanges(); // clear current selection
    window.getSelection().addRange(range); // to select text
    document.execCommand("copy");
    window.getSelection().removeAllRanges();// to deselect
}

//https://stackoverflow.com/questions/10073699/pad-a-number-with-leading-zeros-in-javascript
function pad(n, width=8, z=0) {
    return (String(z).repeat(width) + String(n)).slice(String(n).length)
} 

function assemble(){
    const instruction = {
        HALT : "0",
        LDAC : "1",
        STAC : "2",
        MVAC : "3",
        MOVR : "4",
        JMP : "5",
        JMPZ : "6",
        OUT : "7",
        SUB : "8",
        ADD : "9",
        INC : "A",
        CLAC : "B",
        AND : "C",
        OR : "D",
        ASHR : "E",
        NOT : "F"
    };

    let label = {};
    //reads the text from the user
    function read(){
        return document.getElementById('asminput').value
    }
    //remove the comments and empty lines
    //returns a list delimited by newline
    function sanitize(raw){
        //remove comments and turn tabs to spaces
        let asmNoComment = raw.replace(/;.*\n/g, '\n').replace(/\t/g, ' ');

        //find and remove empty lines
        let asmLines = asmNoComment.split('\n');
        let asmNoEmpty = [];
        asmLines.forEach((x) => {
            if(x.trim().length){
                asmNoEmpty.push(x.trim());
            }
        })
        return asmNoEmpty;
    }
    //print the assembled program
    function print_code(code){
        let codeprompt = "CODE";
        let codediv = document.getElementById('codeTitle').innerHTML;
        if(codeprompt != codediv.split(":")[0]){
            document.getElementById('codeTitle').innerHTML = codeprompt+':';
            document.getElementById('codeTitle').innerHTML += codediv;
        }

        document.getElementById('pos').innerHTML = 'N:<br>';
        document.getElementById('code').innerHTML = '';
        code.forEach((line, index) => {
            document.getElementById('pos').innerHTML += index + ':<br> ';
            document.getElementById('code').innerHTML += pad(line.toString(16),8) + '<br>';
        });
    }
    //translate assembly to opcodes and data
    //we'll do 2 passes:
    //first pass will define labels
    //second pass will resolve lables
    function translate(asm){
        let mem = [];
        asm.forEach((x, index) => {
            let line = x.split(' ');
            //either the line is a lable or an instruction
            //line is an instruction
            if(line[0] in instruction){
                mem.push(instruction[line[0]]);
                //we could probably assume one item here
                for(let i = 1; i < line.length; i++){
                    mem.push(line[i]);                    
                }
            //line is a lable
            }else{
                //remember where the lable is
                label[line[0].replace(":", '')] = mem.length;
                //we could probably assume one item here
                for(let i = 1; i < line.length; i++){
                    mem.push(line[i]);                    
                }
            }
        });

        //this is going to mutate mem in place rather than make a new arr.
        //user inputs numbers in hex
        mem.forEach((x, index) => {
            //resolve labels
            if(x in label){
                mem[index] = label[x];
            }
            else{
                //parse hex
                mem[index] = parseInt(mem[index], 16);                
            }
        })
        rsc.codelen = mem;
        print_code(mem);
        return mem;
    }
    return translate(sanitize(read()));
}

const ins = {
    HALT : 0,
    LDAC : 1,
    STAC : 2,
    MVAC : 3,
    MOVR : 4,
    JMP : 5,
    JMPZ : 6,
    OUT : 7,
    SUB : 8,
    ADD : 9,
    INC : 10,
    CLAC : 11,
    AND : 12,
    OR : 13,
    ASHR : 14,
    NOT : 15
};


//print the value of each register
let rsc = {
    code : [],
    stepcnt : 0,
    codelen : 0,
    stopped : 0,

    //create registers
    component : {
        AR : 0,
        IR : 0,
        OUTR : 0,
        DR : 0,
        R : 0,
        ACC : 0,
        PC : 0,
        S : 0,
        Z : 0,
        SC : 0,
        M : [],
    },

    reset : function(){
        this.component.AR = 0;
        this.component.IR = 0;
        this.component.OUTR = 0;
        this.component.DR = 0;
        this.component.R = 0;
        this.component.ACC = 0;
        this.component.PC = 0;
        this.component.S = 0;
        this.component.Z = 0;
        this.component.SC = 0;
        this.component.M = Array.from(this.code);
        this.print_debug();
        this.reset_trace();
        this.dump_mem();
        this.reset_output();
        this.enable_run();
    },

    enable_run : function() {
        document.getElementById("ins").disabled = false;
        document.getElementById("tstep").disabled = false;
        document.getElementById("run").disabled = false;
        document.getElementById("stop").disabled = false;
    },

    enable_asm : function() {
        document.getElementById("asm").disabled = false;
        document.getElementById("copy").disabled = false;
    },
    
    disable_run : function() { 
        document.getElementById("ins").disabled = true;
        document.getElementById("tstep").disabled = true;
        document.getElementById("run").disabled = true;
    },

    disable_stop : function() {
        document.getElementById("stop").disabled = true;
    },

    disable_asm : function() {
        document.getElementById("asm").disabled = true;
        document.getElementById("copy").disabled = true;
    },
    
    _stop : function() {
        this.stopped = 1;
    },

    reset_output : function() {
        document.getElementById('output').innerHTML = ''        
    },
    
    print_debug : function() {
        document.getElementById('debug').innerHTML =
            'REGISTERS:<br>' +
            'AR   = ' + this.component.AR.toString(16) + '<br>' +
            'IR   = ' + this.component.IR.toString(16) + '<br>' +
            'OUTR = ' + this.component.OUTR.toString(16) + '<br>' +
            'DR   = ' + this.component.DR.toString(16) + '<br>' + 
            'R    = ' + this.component.R.toString(16) + '<br>' +
            'ACC  = ' + this.component.ACC.toString(16) + '<br>' +
            'PC   = ' + this.component.PC.toString(16) + '<br>' +
            'S    = ' + this.component.S.toString(16) + '<br>' +
            'Z    = ' + this.component.Z.toString(16) + '<br>' +
            'SC   = ' + this.component.SC.toString(16) + '<br>';
    },

    add_to_trace : function(elem){
        let trace = document.getElementById('trace').innerHTML;
        if(trace === ''){
            document.getElementById('trace').innerHTML = 'TRACE:<br>';
        }else{
            document.getElementById('trace').innerHTML += elem + '<br>';
        }
    },

    reset_trace : function(){
        document.getElementById('trace').innerHTML = 'TRACE:<br>';
    },

    dump_mem : function(){
        let mem = document.getElementById('mem').innerHTML;
        document.getElementById('mem').innerHTML = 'MEMORY:<br>';
        this.component.M.forEach((x, i) => {
            document.getElementById('mem').innerHTML += pad(x.toString(16),8) + '<br>';
            if(i >= this.codelen){
                document.getElementById('pos').innerHTML += i + ':<br>';
            }
        });
    },
    
    T : function(){
        switch(this.component.SC){
        case 0:
            this.component.AR = this.component.PC;
            break;
        case 1:
            this.component.DR = this.component.M[this.component.PC];
            this.component.PC++;
            break;
        case 2:
            this.component.IR = this.component.DR;
            this.component.AR = this.component.PC;
            break;
        }
        switch(this.component.IR){
            //HALT
        case ins.HALT:
            switch(this.component.SC){
            case 3:
                this.add_to_trace("HALT");
                this.component.S = 1;
                break;
            default:
                ;
            }
            break;
            //LDAC
        case ins.LDAC:
            switch(this.component.SC){
            case 3:
                this.add_to_trace("LDAC");
                this.component.DR = this.component.M[this.component.PC];
                this.component.PC++;
                break;
            case 4:
                this.component.AR = this.component.DR;
                break;
            case 5:
                this.component.DR = this.component.M[this.component.AR];
                break;
            case 6:
                this.component.ACC = this.component.DR;
                this.setZ();
                break;
            case 7:
                this.component.SC = -1;
                break;
            default:
                ;
            }
            break;
            //STAC
        case ins.STAC:
            switch(this.component.SC){
            case 3:
                this.add_to_trace("STAC");
                this.component.DR = this.component.M[this.component.PC++];
                break;
            case 4:
                this.component.AR = this.component.DR;
                break;
            case 5:
                this.component.DR = this.component.ACC;
                break;
            case 6:
                this.component.M[this.component.AR] = this.component.DR;
                break;
            case 7:
                this.component.SC = -1;
                break;
            default:
                ;
            }
            break;
            //MVAC
        case ins.MVAC:
            switch(this.component.SC){
            case 3:
                this.add_to_trace("MVAC");
                this.component.R = this.component.ACC;
                break;
            case 4:
                this.component.SC = -1;
                break;
            default:
                ;
            }
            break;
            //MOVR
        case ins.MOVR:
            switch(this.component.SC){
            case 3:
                this.add_to_trace("MOVR");
                this.component.ACC = this.component.R;
                this.setZ();
                break;
            case 4:
                this.component.SC = -1;
                break;
            default:
                ;
            }
            break;
            //JMP
        case ins.JMP:
            switch(this.component.SC){
            case 3:
                this.add_to_trace("JMP");
                this.component.DR = this.component.M[this.component.PC];
                break;
            case 4:
                this.component.PC = this.component.DR;
                break;
            case 5:
                this.component.SC = -1;
                break;
            default:
                ;
            }
            break;
            //JMPZ
        case ins.JMPZ:
            if(this.component.Z == 1){
                switch(this.component.SC){
                case 3:
                    this.add_to_trace("JMPZ Z=1");
                    this.component.DR = this.component.M[this.component.PC];
                    break;
                case 4:
                    this.component.PC = this.component.DR;
                    break;
                case 5:
                    this.component.SC = -1;
                    break;
                default:
                    ;
                }
            }
            else{
                switch(this.component.SC){
                case 3:
                    this.add_to_trace("JMPZ Z=0");
                    this.component.PC++;
                    break;
                case 4:
                    this.component.SC = -1;
                    break;
                default:
                    ;
                }
            }
            break;
            //OUT
        case ins.OUT:
            switch(this.component.SC){
            case 3:
                this.add_to_trace("OUT");
                this.component.OUTR = this.component.ACC;
                break;
            case 4:
                this.component.SC = -1;
                break;
            default:
                ;
            }
            break;
            //SUB
        case ins.SUB:
            switch(this.component.SC){
            case 3:
                this.add_to_trace("SUB");
                this.component.ACC = this.component.ACC - this.component.R;
                this.setZ();
                break;
            case 4:
                this.component.SC = -1;
                break;
            default:
                ;
            }                
            break;
            //ADD
        case ins.ADD:
            switch(this.component.SC){
            case 3:
                this.add_to_trace("ADD");
                this.component.ACC = this.component.ACC + this.component.R;
                this.setZ();
                //return;
                break;
            case 4:
                this.component.SC = -1;
                break;
            }                                
            break;
            //INC
        case ins.INC:
            switch(this.component.SC){
            case 3:
                this.add_to_trace("INC");
                this.component.ACC++;
                this.setZ();
            case 4:
                this.component.SC = -1;
                break;
            }                
            break;
            //CLAC
        case ins.CLAC:
            switch(this.component.SC){
            case 3:
                this.add_to_trace("CLAC");
                this.component.ACC = 0;
                break;
            case 4:
                this.component.SC = -1;
                break;
            }                
            break;
            //AND
        case ins.AND:
            switch(this.component.SC){
            case 3:
                this.add_to_trace("AND");
                this.component.ACC = this.component.ACC & this.component.R;
                break;
            case 4:
                this.component.SC = -1;
                break;
            }                
            break;
            //OR
        case ins.OR:
            switch(this.component.SC){
            case 3:
                this.add_to_trace("OR");
                this.component.ACC = this.component.ACC | this.component.R;
                break;
            case 4:
                this.component.SC = -1;
                break;
            }                
            break;
            //ASHR
        case ins.ASHR:
            switch(this.component.SC){
            case 3:
                this.add_to_trace("ASHR");
                this.component.ACC = this.component.ACC >>> 1;
                break;
            case 4:
                this.component.SC = -1;
                break;
            }                
            break;
            //NOT
        case ins.NOT:
            switch(this.component.SC){
            case 3:
                this.add_to_trace("NOT");
                this.component.ACC = ~this.component.ACC;
                break;
            case 4:
                this.component.SC = -1;
                break;
            }                
            break;
        }
        this.component.SC++;
    },
    
    //should be called each time ACC is modified
    setZ : function() {
        if(this.component.ACC == 0){
            this.component.Z = 1;
        }
        else{
            this.component.Z = 0;
        }
    },
    
    //increment to next T
    _step : function(){
        if(!this.stepcnt){
            //load
            this.component.M = Array.from(this.code);
            //remember the length of the original code
            this.codelen = this.component.M.length;
        }
        this.stepcnt++;
        this.T();
    },
    //execute next instruction
    _ins : function(){
        let complete = 0
        while(!complete){
            this.step();
            if(this.component.SC == 0){
                complete = 1;
            }
        }
    },
    //run until HALT
    _run : function(rsc){
        if(!rsc.component.S && !rsc.stopped) {
            rsc._step();
            setTimeout(rsc._run, 0, rsc);
            rsc.flush_output();
        }
    },
    //print to output
    flush_output : function(){
        if(this.component.S == 1){
            this.disable_run();
            this.disable_stop();
        }
        this.print_debug();
        this.dump_mem();
        document.getElementById('output').innerHTML = 'OUTPUT: ' + this.component.OUTR.toString(16);
    },
    //rsc functions
    run : function() {
        this.disable_run();
        this.stopped = 0;
        this._run(this);
    },
    ins : function() {
        this._ins();
        this.flush_output();
        
    },
    step : function() {
        this._step();
        this.flush_output();        
    },
    stop : function(){
        this.enable_asm();
        this.enable_run();
        this._stop();
    }
}

