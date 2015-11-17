var jscodeshift = require('jscodeshift');
var expect = require('chai').expect;
var fs = require('fs');
var path = require('path');

var transform = function(name, inputPath, outputPath) {

    var transformer = require(`../${name}`); // eslint-disable-line global-require

    var inputPathFull = path.resolve(__dirname, name, inputPath);
    var inputSource = fs.readFileSync(inputPathFull).toString();
    var outpuPathFull = path.resolve(__dirname, name, outputPath);
    var outputSource = fs.readFileSync(outpuPathFull).toString();

    expect(transformer({
        path: inputPath,
        source: inputSource
    }, {jscodeshift}))
        .to.be.equal(outputSource);

};

const test = (transformerName, description, fixturesNames) => {

    describe(transformerName, () => {

        describe(description, () => {

            fixturesNames
                .forEach((name) =>
                    it(name, () => // eslint-disable-line max-nested-callbacks
                        transform(transformerName, `./${name}.input.js`, `./${name}.output.js`)));

        });

    });

};

test('mashup-to-commonjs', 'converts mashup module to CommonJS', [
    'add-mashup',
    'add-module'
]);
test('amd-to-commonjs', 'converts AMD module to CommonJS', [
    'with-args-as-deps',
    'with-require-as-argument',
    'without-return'
]);
test('class-to-native', 'converts tau class to ES class', ['simple']);
test('one-var', 'converts sequence of declarations to separate declarations', ['preserve-comments']);
