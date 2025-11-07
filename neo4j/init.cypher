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

// Relationship property indexes
CREATE INDEX to_context IF NOT EXISTS FOR ()-[r:TO]-() ON (r.context);
CREATE INDEX to_statement IF NOT EXISTS FOR ()-[r:TO]-() ON (r.statement);
CREATE INDEX to_user IF NOT EXISTS FOR ()-[r:TO]-() ON (r.user);
CREATE INDEX at_context IF NOT EXISTS FOR ()-[r:AT]-() ON (r.context);
CREATE INDEX at_statement IF NOT EXISTS FOR ()-[r:AT]-() ON (r.statement);
CREATE INDEX at_user IF NOT EXISTS FOR ()-[r:AT]-() ON (r.user);
CREATE INDEX by_context IF NOT EXISTS FOR ()-[r:BY]-() ON (r.context);
CREATE INDEX by_statement IF NOT EXISTS FOR ()-[r:BY]-() ON (r.statement);
CREATE INDEX by_user IF NOT EXISTS FOR ()-[r:BY]-() ON (r.user);
CREATE INDEX of_context IF NOT EXISTS FOR ()-[r:OF]-() ON (r.context);
CREATE INDEX of_user IF NOT EXISTS FOR ()-[r:OF]-() ON (r.user);
CREATE INDEX in_context IF NOT EXISTS FOR ()-[r:IN]-() ON (r.context);
CREATE INDEX in_user IF NOT EXISTS FOR ()-[r:IN]-() ON (r.user);

// Relationship fulltext indexes
CREATE FULLTEXT INDEX to_context_fulltext IF NOT EXISTS FOR ()-[r:TO]-() ON EACH [r.context];
CREATE FULLTEXT INDEX to_statement_fulltext IF NOT EXISTS FOR ()-[r:TO]-() ON EACH [r.statement];
CREATE FULLTEXT INDEX to_user_fulltext IF NOT EXISTS FOR ()-[r:TO]-() ON EACH [r.user];
CREATE FULLTEXT INDEX at_context_fulltext IF NOT EXISTS FOR ()-[r:AT]-() ON EACH [r.context];
CREATE FULLTEXT INDEX at_statement_fulltext IF NOT EXISTS FOR ()-[r:AT]-() ON EACH [r.statement];
CREATE FULLTEXT INDEX at_user_fulltext IF NOT EXISTS FOR ()-[r:AT]-() ON EACH [r.user];
CREATE FULLTEXT INDEX by_context_fulltext IF NOT EXISTS FOR ()-[r:BY]-() ON EACH [r.context];
CREATE FULLTEXT INDEX by_statement_fulltext IF NOT EXISTS FOR ()-[r:BY]-() ON EACH [r.statement];
CREATE FULLTEXT INDEX by_user_fulltext IF NOT EXISTS FOR ()-[r:BY]-() ON EACH [r.user];
CREATE FULLTEXT INDEX of_context_fulltext IF NOT EXISTS FOR ()-[r:OF]-() ON EACH [r.context];
CREATE FULLTEXT INDEX of_user_fulltext IF NOT EXISTS FOR ()-[r:OF]-() ON EACH [r.user];
CREATE FULLTEXT INDEX in_context_fulltext IF NOT EXISTS FOR ()-[r:IN]-() ON EACH [r.context];
CREATE FULLTEXT INDEX in_user_fulltext IF NOT EXISTS FOR ()-[r:IN]-() ON EACH [r.user];
