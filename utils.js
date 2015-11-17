var j = require('jscodeshift');

const moduleExports = (node) => j.expressionStatement(

    j.assignmentExpression(
        '=',
        j.memberExpression(j.identifier('module'), j.identifier('exports')),
        node
    )
);

const splitBody = (blockStatement) => {

    const body = blockStatement.body.filter((v) => v.type !== 'ReturnStatement');
    const returned = blockStatement.body.filter((v) => v.type === 'ReturnStatement')[0];

    return {body, returned};

};

module.exports = {
    moduleExports,
    splitBody
};
