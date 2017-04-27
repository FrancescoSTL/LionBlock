# LionBlock
An Adblock for Google Chrome developed as a senior CS capstone project for team AdBuster at Lindenwood University.

### Developing LionBlock on Chrome

Clone the repository by running:
```
git clone https://github.com/FrancescoSTL/LionBlock.git
```
Download and install [Node.js](https://nodejs.org/en/download/)

We use Browserify which allows us to bundle our code and require modules. To bundle LionBlock, run:

1. `npm install`
2. `npm run bundle`

Go to [chrome://extensions/](chrome://extensions) and enable Developer mode. Then, click on the **Load unpacked extension** and select the LionBlock folder.

##### DEVELOPER'S NOTE
If you have been working on the blocker.js, you **NEED** to run `npm run bundle` so those changes are effective. Also, if the extension is not working as you would expect -- given that your code is correct -- then remove the extension and add it back again.

##### Congratulations! Now you have LionBlock in your browser 🎉

### Debugging the extension
To open the developer tools for the extension you need to go to [chrome://extensions/](chrome://extensions) and click on Inspected views: **_background_ page** 

## Team
* [Andres Rodriguez](andresrodh.com)
* Boris Pallares
* [Francesco Polizzi](francesco.tech)
* Marco De Lucca
* Nicholas Haghighi