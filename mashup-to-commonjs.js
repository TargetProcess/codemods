'use strict';

const utils = require('./utils');
const moduleExports = utils.moduleExports;
const splitBody = utils.splitBody;

module.exports = (file, api) => {

    const j = api.jscodeshift;

    const transformArgumentsToDeclarations = (callExpressionNode, vars) => {

        let callee = callExpressionNode.callee;
        let vals = [];
        let csses = [];

        while (callee && callee.object.type === 'CallExpression') {

            var val = callee.object.arguments[0].value;

            if (val.match(/\.css$/)) {

                csses = [val].concat(csses);

            } else {

                vals = [val].concat(vals);

            }

            callee = callee.object.callee;

        }

        return vars.map((name, k) => {

            var value = vals[k];

            if (value) {

                return j.variableDeclaration('var', [
                    j.variableDeclarator(j.identifier(name),
                        j.callExpression(j.identifier('require'), [j.literal(value)])
                    )
                ]);

            } else {

                return j.variableDeclaration('var', [
                    j.variableDeclarator(j.identifier(name),
                        j.memberExpression(j.identifier('mashup'), j.identifier('config'))
                    )
                ]);

            }

        }).concat(csses.map((name) => {

            return j.expressionStatement(j.callExpression(j.identifier('require'), [j.literal(name)]));

        }));

    };

    const transformFunction = (callExpressionNode, functionExpressionNode) => {

        const vars = functionExpressionNode.params.map((v) => v.name);
        const splittedBody = splitBody(functionExpressionNode.body);

        const declarations = transformArgumentsToDeclarations(callExpressionNode, vars);

        return declarations
            .concat(splittedBody.body)
            .concat(splittedBody.returned ? moduleExports(splittedBody.returned.argument) : void 0);

    };

    const transformAsMain = (node) => {

        const functionExpressionNode = node.arguments[0];

        return transformFunction(node, functionExpressionNode);

    };

    const transformAsModule = (node) => {

        const functionExpressionNode = node.arguments[1];

        return transformFunction(node, functionExpressionNode);

    };

    return j(file.source)
        .find(j.ExpressionStatement)
        .replaceWith((path) => {

            const node = path.node;
            const callExpressionNode = node.expression;
            const callee = callExpressionNode.callee;

            if (callee && callee.property) {

                if (callee.property.name === 'addMashup') return transformAsMain(callExpressionNode);
                if (callee.property.name === 'addModule') return transformAsModule(callExpressionNode);

            }

            return node;

        })
        .toSource();

};
