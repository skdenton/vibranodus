const neo4j = require('neo4j-driver');
const options = require('../options');

const driver = neo4j.driver(
  options.neo4jhost,
  neo4j.auth.basic(options.neo4juser, options.neo4jpass)
);

function toPlain(record) {
  if (!record) return null;
  if (record.toObject) return record.toObject();
  return record;
}

function cypherQuery(query, params, cb) {
  if (typeof params === 'function') {
    cb = params;
    params = {};
  }
  const session = driver.session();
  session
    .run(query, params)
    .then((result) => {
      const data = result.records.map(toPlain);
      session.close();
      cb(null, { data });
    })
    .catch((err) => {
      session.close();
      cb(err);
    });
}

function insertNode(props, label, cb) {
  const session = driver.session();
  const query = `CREATE (n:${label} $props) RETURN n`;
  session
    .run(query, { props })
    .then((result) => {
      const node = result.records[0].get('n');
      session.close();
      cb(null, {
        _id: node.identity.toInt ? node.identity.toInt() : node.identity,
        uid: props.uid,
        ...node.properties,
      });
    })
    .catch((err) => {
      session.close();
      cb(err);
    });
}

function beginAndCommitTransaction(obj, cb) {
  const session = driver.session();
  const tx = session.beginTransaction();
  const runAll = async () => {
    try {
      for (const stmt of obj.statements) {
        await tx.run(stmt.statement, stmt.parameters || {});
      }
      await tx.commit();
      session.close();
      cb(null, { data: [] });
    } catch (err) {
      await tx.rollback();
      session.close();
      cb(err);
    }
  };
  runAll();
}

module.exports = {
  cypherQuery,
  insertNode,
  beginAndCommitTransaction,
  driver,
};
