from tree_sitter import Language, Parser
import tree_sitter_javascript as tslang

language = Language(tslang.language(), 'javascript')
