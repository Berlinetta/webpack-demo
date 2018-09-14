import printLess from './print.less';
import singMe from './sing.js';

console.log("print style: " + printLess.print);

export default function printMe() {
    singMe();
    console.log('I get called from print.js!');
}