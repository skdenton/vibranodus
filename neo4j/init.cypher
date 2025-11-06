// Ensure APOC triggers are enabled before running this script.
// Index setup
CREATE INDEX user_name_index IF NOT EXISTS FOR (u:User) ON (u.name);
CREATE INDEX user_uid_index IF NOT EXISTS FOR (u:User) ON (u.uid);
CREATE INDEX concept_name_index IF NOT EXISTS FOR (c:Concept) ON (c.name);
CREATE INDEX concept_uid_index IF NOT EXISTS FOR (c:Concept) ON (c.uid);
CREATE INDEX context_name_index IF NOT EXISTS FOR (ctx:Context) ON (ctx.name);
CREATE INDEX context_uid_index IF NOT EXISTS FOR (ctx:Context) ON (ctx.uid);
CREATE INDEX context_by_index IF NOT EXISTS FOR (ctx:Context) ON (ctx.by);
CREATE INDEX statement_name_index IF NOT EXISTS FOR (s:Statement) ON (s.name);
CREATE INDEX statement_uid_index IF NOT EXISTS FOR (s:Statement) ON (s.uid);

// Reset existing triggers so the script is idempotent
CALL apoc.trigger.remove('RELATIONSHIP_INDEX');
CALL apoc.trigger.remove('RELATIONSHIP_INDEX_REMOVE_TO');
CALL apoc.trigger.remove('RELATIONSHIP_INDEX_REMOVE_AT');
CALL apoc.trigger.remove('RELATIONSHIP_INDEX_REMOVE_BY');
CALL apoc.trigger.remove('RELATIONSHIP_INDEX_REMOVE_OF');
CALL apoc.trigger.remove('RELATIONSHIP_INDEX_REMOVE_IN');

// Recreate triggers
CALL apoc.trigger.add(
  'RELATIONSHIP_INDEX',
  'UNWIND $createdRelationships AS r MATCH ()-[r]->() CALL apoc.index.addRelationship(r,["user","context","statement","gapscan"]) RETURN count(*)',
  {phase: 'after'}
);

CALL apoc.trigger.add(
  'RELATIONSHIP_INDEX_REMOVE_TO',
  'UNWIND $deletedRelationships AS r MATCH ()-[r:TO]->() CALL apoc.index.removeRelationshipByName("TO", r) RETURN count(*)',
  {phase: 'after'}
);

CALL apoc.trigger.add(
  'RELATIONSHIP_INDEX_REMOVE_AT',
  'UNWIND $deletedRelationships AS r MATCH ()-[r:AT]->() CALL apoc.index.removeRelationshipByName("AT", r) RETURN count(*)',
  {phase: 'after'}
);

CALL apoc.trigger.add(
  'RELATIONSHIP_INDEX_REMOVE_BY',
  'UNWIND $deletedRelationships AS r MATCH ()-[r:BY]->() CALL apoc.index.removeRelationshipByName("BY", r) RETURN count(*)',
  {phase: 'after'}
);

CALL apoc.trigger.add(
  'RELATIONSHIP_INDEX_REMOVE_OF',
  'UNWIND $deletedRelationships AS r MATCH ()-[r:OF]->() CALL apoc.index.removeRelationshipByName("OF", r) RETURN count(*)',
  {phase: 'after'}
);

CALL apoc.trigger.add(
  'RELATIONSHIP_INDEX_REMOVE_IN',
  'UNWIND $deletedRelationships AS r MATCH ()-[r:IN]->() CALL apoc.index.removeRelationshipByName("IN", r) RETURN count(*)',
  {phase: 'after'}
);
