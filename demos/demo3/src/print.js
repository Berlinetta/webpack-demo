import singMe from './sing.js';

export default function printMe() {
    singMe();
    console.log('I get called from print.js!');
}