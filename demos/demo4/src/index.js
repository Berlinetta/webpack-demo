//import './style.css';
//import './styles.less';
import stylesLess from './styles.less';
import printMe from './print.js';
import _ from 'lodash';
//import './sources/arrow.jpg';

console.log("highlight style: " + stylesLess.highlight);

printMe();

console.log(_.isArray([]));

console.log("index.js end.");

export const testA = "testA";
export const testB = "testB";


export default {
    pm: printMe,
    ss: stylesLess.highlight
};