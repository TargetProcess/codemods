module.exports = (file, api) => {

    const j = api.jscodeshift;

    return j(file.source)
        .find(j.VariableDeclaration)
        .replaceWith((v) => {

            const node = v.node;

            if (node.declarations.length === 1 &&
                node.declarations[0].init &&
                node.declarations[0].init.callee &&
                node.declarations[0].init.callee.type === 'MemberExpression' &&
                node.declarations[0].init.callee.object.name === 'Class' &&
                node.declarations[0].init.callee.property.name === 'extend'
            ) {

                const cls = node.declarations[0];

                const body = cls.init.arguments[0].properties.map((prop) => {

                    return j.methodDefinition('method', j.identifier(prop.key.name === 'init' ?
                        'constructor' : prop.key.name), prop.value);

                });

                return j.classDeclaration(j.identifier(cls.id.name), j.classBody(body));

            }

            return node;

        })
        .toSource();

};
