import * as readline from 'readline-sync';

type INVESTMENT = {
    originalInvestment: number 
    currentInvestment : number | 0
    timeHorizon : number,
    returnValue : number,
    reinvestmentGains ?: number,
    preferences: string
}

type REQUESTED_USER_DATA = {
    originalInvestment: number;
    timeHorizon: number;
    returnValue: number;
    preferences: string;
}

class Investment {
    originalInvestment: number 
    currentInvestment: number 
    timeHorizon: number
    returnValue: number
    reinvestmentGains : number
    preferences: string

    constructor(){
        this.originalInvestment =  0;
        this.currentInvestment = 0;
        this.timeHorizon = 0;
        this.returnValue = 0;
        this.reinvestmentGains = 0;
        this.preferences = 'n'
    }
    
    public clear(){
        return {
            original: () => this.originalInvestment = 0,
            current: () => this.currentInvestment = 0,
            time: () => this.timeHorizon = 0,
            returnVal: () => this.returnValue = 0
        }
    }

    public set(){
        return {
            investment: (inv : number) => {
                if(!!this.currentInvestment) console.error('Investments set already')
                if(!this.originalInvestment) this.originalInvestment = inv;
                else this.currentInvestment = inv;
            },
            time: (time: number) => this.timeHorizon = time,
            return: (returnVal: number) => this.returnValue = returnVal / 100,
            preferences: (pref: string) => this.preferences = pref
        }
    }

    public update(){
        return {
            investment: (inv: number) => this.currentInvestment = inv,
            reinvestment: (reinvestment: number) => this.reinvestmentGains = reinvestment,

        } 
    }

    public compound(){
        // delete all params besided inv, and call them from investment object
        const getGrowth = (inv: number) => inv * this.returnValue;
        const getCurrentInvestment = (inv: number) => getGrowth(inv) + inv;
        
        return new Promise((resolve, reject) => {
            const update = this.update();

            for(let i = 0; i <= this.timeHorizon; i++) {
                if(!this.currentInvestment) {
                    update.reinvestment(getGrowth(this.originalInvestment));
                    update.investment(getCurrentInvestment(this.originalInvestment))
                } else {
                    update.reinvestment(getGrowth(this.currentInvestment));
                    update.investment(getCurrentInvestment(this.currentInvestment))
                }
                if(this.preferences === 'y')  console.log(`Year ${i}: ${this.currentInvestment.toFixed(2)}`)
            }
            resolve()
        })
    }
}


class Interface {
    // I returned promises for many of the interface methods to ensure that they were all executed before returning to the main method.
    investment = new Investment;
    investments: INVESTMENT[] = [];

    public main(){
        const mainKeys = ['d', 'p', 'r', 'c', 'f', 'a', 's'];
        const nextStep = readline.keyIn(`\nMain Menu:\n[d] submit your data and settings\n[a] add another investment to profile\n[p] print user investment profile\n[r] reset user investment profile\n[s] sum all investments\n[f] finished for today: \n`, {limit: mainKeys})
      
        if(nextStep === 'd') {
            this.getData()
            .then(inv => this.setData(inv))
            .then(() => this.compound())
            .then(() => this.main())
        }
        else if(nextStep ==='p') this.print().then(() => this.main());
        else if(nextStep ==='r') this.resetProfile().then(() => this.main())
        else if(nextStep ==='a') this.anotherInvestment().then(() => this.main())
        else if(nextStep ==='s') this.sum().then(() => this.main())
        else if(nextStep ==='f') this.finish(); 
    }
    
    public finish(){
        console.log(`Glad you were able to try my calculator, here's your current user profile \n`, this.investments);
        // Allow some time for the user to look at their investments before the app ends.
        setTimeout(() => {}, 2500);
    }

    public compound(){
        this.investment.compound()
        return Promise.resolve()
    }

    public anotherInvestment(){
        // reset investment by creating new investment
        this.investment = new Investment;
        console.log('Investment was added to profile');
        return Promise.resolve()
    }

    public sum(){
        let total = 0;
        
        return new Promise((resolve, reject) => {
            if(!this.investments.length) {
                console.log('Sum of total investments is not set yet!')
                resolve()
            }
            this.investments.forEach((investment: INVESTMENT, index) => {
                total += investment.currentInvestment
                if(index === this.investments.length - 1) {
                    console.log('Sum of total investments', total);
                    resolve()
                }
            })  
        })
    }

    public print(){
        console.log(this.investments)
        return Promise.resolve();
    }

    public reset(){
        const clear = this.investment.clear()

        clear.current();
        clear.original();
        clear.returnVal();
        clear.time();
        
        console.log('Investment has been reset');
        return Promise.resolve();
    }

    public resetProfile(): Promise<void>{
        this.investments = []
        console.log('Investment Profile has been reset');
        return Promise.resolve();
    }
    
    public findUser(){
        return this.investments.find((inv : INVESTMENT) : boolean => this.investment === inv)
    }

    public getData(): Promise<REQUESTED_USER_DATA>{
        if(!!this.findUser){
            // remove investment from investments list to avoid saving unwanted data
            this.investments = this.investments.filter((inv: INVESTMENT) => inv != this.findUser())
        }

        return new Promise((resolve, reject) => {
            const originalInvestment = parseInt(readline.question("What is the value of your investment: $"))
            const timeHorizon = parseInt(readline.question('How many years would you like to be invested: '))
            const returnValue = parseInt(readline.question('What would you like your return value to be: '))
            const preferences = readline.keyIn(`Would you like to know yearly growth change: \n[y] Yes \n[n] No: `, {limit: 'yn'})

            resolve({
                originalInvestment,
                timeHorizon,
                returnValue,
                preferences,
            })
        })
    }
    
    public setData(inv: REQUESTED_USER_DATA){
        const set = this.investment.set();

        // reset investment if already set
        if(!!this.investment.currentInvestment) this.reset()
  
        set.investment(inv.originalInvestment);
        set.time(inv.timeHorizon);
        set.return(inv.returnValue);
        set.preferences(inv.preferences);
        this.investments.push(this.investment);

        return Promise.resolve();
    }
}

function main(){
    new Interface().main();
}

main()