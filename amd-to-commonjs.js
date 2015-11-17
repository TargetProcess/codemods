'use strict';

const utils = require('./utils');
const moduleExports = utils.moduleExports;
const splitBody = utils.splitBody;

module.exports = function(file, api) {

    const j = api.jscodeshift;

    const transformArgumentsToDeclarations = (requiredModulesNames, requiredModulesVars) => {

        return requiredModulesNames.map((moduleName, k) => {

            var varName = requiredModulesVars[k];

            if (varName) {

                return j.variableDeclaration('var', [
                    j.variableDeclarator(j.identifier(varName.name),
                        j.callExpression(j.identifier('require'), [j.literal(moduleName.value)])
                    )
                ]);

            } else {

                return j.expressionStatement(j.callExpression(j.identifier('require'), [j.literal(
                    moduleName.value)]));

            }

        });

    };

    const transformArgumentsAsDependencies = (v) => {

        const args = v.arguments[0].elements;
        const func = v.arguments[1];

        const declarations = transformArgumentsToDeclarations(args, func.params);

        const splittedBody = splitBody(func.body);

        return declarations
            .concat(splittedBody.body)
            .concat(splittedBody.returned ? moduleExports(splittedBody.returned.argument) : void 0);

    };

    const transformAsWrapper = (v) => {

        const func = v.arguments[0];

        const splittedBody = splitBody(func.body);

        return splittedBody.body.concat(splittedBody.returned ? moduleExports(splittedBody.returned.argument) : void 0);

    };

    return j(file.source)
        .find(j.ExpressionStatement)
        .replaceWith((vv) => {

            const v = vv.node.expression;

            if (v.type === 'CallExpression' && v.callee.name === 'define') {

                if (v.arguments.length === 2 && v.arguments[0].type === 'ArrayExpression') {

                    return transformArgumentsAsDependencies(v);

                }

                if (v.arguments.length === 1 && v.arguments[0].type === 'FunctionExpression') {

                    return transformAsWrapper(v);

                }

            }

            return vv.node;

        })
        .toSource();

};
