'use strict';

module.exports = function(file, api) {

    const j = api.jscodeshift;

    const transformDeclarations = (node) => {

        let declarations = node.declarations;

        const declComments = declarations.map((decl) => (decl.comments || []).map((c) => {

            c.loc = {};
            c.range = [];
            c.end = null;
            c.start = null;
            c.leading = false;
            c.trailing = true;

            return c;

        }));

        declarations = declarations.map((v) => {

            v.comments = null;
            v.leadingComments = null;

            return v;

        });

        const mainComments = (node.comments || []).map((comment) => {

            comment.loc = {};

            return comment;

        });

        const mainCommentsTrailing = mainComments.filter((v) => v.trailing);
        const mainCommentsLeading = mainComments.filter((v) => v.leading);

        return declarations.map((declaration, i) => {

            const declarationNode = j.variableDeclaration(node.kind, [declaration]);

            declarationNode.comments = declComments[i + 1] || [];

            if (i === 0) {

                declarationNode.comments = mainCommentsLeading.concat(declarationNode.comments);

            }

            if (i === declarations.length - 1) {

                declarationNode.comments = declarationNode.comments.concat(mainCommentsTrailing);

            }

            return declarationNode;

        });

    };

    return j(file.source)
        .find(j.VariableDeclaration)
        .replaceWith((path) => {

            const parentType = path.parentPath.value.type;
            const node = path.node;

            if (parentType === 'ForStatement' || parentType === 'WhileStatement') return node;

            return transformDeclarations(node);

        })
        .toSource();

};
