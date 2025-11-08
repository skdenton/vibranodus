const neo4j = require('neo4j-driver');
const options = require('../../options');

const driver = neo4j.driver(
  options.neo4jhost,
  neo4j.auth.basic(options.neo4juser, options.neo4jpass)
);

function convertInteger(value) {
  if (neo4j.isInt(value)) {
    const numberValue = value.toNumber();
    return Number.isSafeInteger(numberValue) ? numberValue : value.toString();
  }
  return value;
}

function normalizeValue(value) {
  if (value == null) return value;

  if (neo4j.isInt(value)) {
    return convertInteger(value);
  }

  if (Array.isArray(value)) {
    return value.map(normalizeValue);
  }

  if (value instanceof neo4j.types.Node) {
    const properties = {};
    Object.entries(value.properties || {}).forEach(([key, val]) => {
      properties[key] = normalizeValue(val);
    });
    return properties;
  }

  if (value instanceof neo4j.types.Relationship) {
    const properties = {};
    Object.entries(value.properties || {}).forEach(([key, val]) => {
      properties[key] = normalizeValue(val);
    });
    return {
      ...properties,
      start: value.startNodeElementId,
      end: value.endNodeElementId,
      type: value.type,
    };
  }

  if (value instanceof neo4j.types.Path) {
    return {
      start: normalizeValue(value.start),
      end: normalizeValue(value.end),
      segments: value.segments.map((segment) => ({
        start: normalizeValue(segment.start),
        relationship: normalizeValue(segment.relationship),
        end: normalizeValue(segment.end),
      })),
    };
  }

  if (typeof value === 'object') {
    const normalized = {};
    Object.entries(value).forEach(([key, val]) => {
      normalized[key] = normalizeValue(val);
    });
    return normalized;
  }

  return value;
}

function normalizeRecord(record) {
  if (!record) return null;

  const row = {};
  record.keys.forEach((key) => {
    row[key] = normalizeValue(record.get(key));
  });

  if (record.keys.length === 1) {
    return row[record.keys[0]];
  }

  return row;
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
      const columns = result.records[0] ? result.records[0].keys : [];
      const data = result.records.map(normalizeRecord);
      session.close();
      cb(null, { columns, data });
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
      const properties = normalizeValue(node);
      cb(null, {
        _id: node.elementId,
        uid: props.uid,
        ...properties,
      });
    })
    .catch((err) => {
      session.close();
      cb(err);
    });
}

function beginAndCommitTransaction(obj, cb) {
  const session = driver.session();
  session.executeWrite(async tx => {
    for (const stmt of obj.statements) {
      await tx.run(stmt.statement, stmt.parameters || {});
    }
  })
  .then(() => {
    session.close();
    cb(null, { data: [] });
  })
  .catch(err => {
    session.close();
    cb(err);
  });
}

function closeDriver() {
  return driver.close();
}

module.exports = {
  cypherQuery,
  insertNode,
  beginAndCommitTransaction,
  driver,
  closeDriver,
};
