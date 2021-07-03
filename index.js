const { dirname, extname, resolve, join } = require('path')

let tempCache;
//let bufferLength;
const moduleCache = {};
const transpiledCache = {};

const rapydscript_variables = `
var ρσ_iterator_symbol = (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") ? Symbol.iterator : "iterator-Symbol-5d0927e5554349048cf0e3762a228256";
var ρσ_kwargs_symbol = (typeof Symbol === "function") ? Symbol("kwargs-object") : "kwargs-object-Symbol-5d0927e5554349048cf0e3762a228256";
var ρσ_cond_temp, ρσ_expr_temp, ρσ_last_exception;
var ρσ_object_counter = 0;
var async = asynchronous = (fn) => fn;
`

const rapydscript_curated_variables = JSON.parse("[\"ρσ_iterator_symbol\",\"ρσ_kwargs_symbol\",\"ρσ_cond_temp\",\"ρσ_expr_temp\",\"ρσ_last_exception\",\"ρσ_object_counter\",\"ρσ_len\",\"ρσ_bool\",\"ρσ_print\",\"ρσ_int\",\"ρσ_float\",\"ρσ_arraylike_creator\",\"options_object\",\"ρσ_id\",\"ρσ_dir\",\"ρσ_ord\",\"ρσ_chr\",\"ρσ_callable\",\"ρσ_bin\",\"ρσ_hex\",\"ρσ_enumerate\",\"ρσ_reversed\",\"ρσ_iter\",\"ρσ_range_next\",\"ρσ_range\",\"ρσ_getattr\",\"ρσ_setattr\",\"ρσ_hasattr\",\"ρσ_get_module\",\"ρσ_pow\",\"ρσ_type\",\"ρσ_divmod\",\"ρσ_max\",\"abs\",\"max\",\"min\",\"bool\",\"type\",\"float\",\"int\",\"arraylike\",\"ρσ_arraylike\",\"print\",\"id\",\"get_module\",\"pow\",\"divmod\",\"dir\",\"ord\",\"chr\",\"bin\",\"hex\",\"callable\",\"enumerate\",\"iter\",\"reversed\",\"len\",\"range\",\"getattr\",\"setattr\",\"hasattr\",\"ρσ_equals\",\"ρσ_not_equals\",\"equals\",\"ρσ_list_extend\",\"ρσ_list_index\",\"ρσ_list_pop\",\"ρσ_list_remove\",\"ρσ_list_to_string\",\"ρσ_list_insert\",\"ρσ_list_copy\",\"ρσ_list_clear\",\"ρσ_list_as_array\",\"ρσ_list_count\",\"ρσ_list_sort_key\",\"ρσ_list_sort_cmp\",\"ρσ_list_sort\",\"ρσ_list_concat\",\"ρσ_list_slice\",\"ρσ_list_iterator\",\"ρσ_list_len\",\"ρσ_list_contains\",\"ρσ_list_eq\",\"ρσ_list_decorate\",\"ρσ_list_constructor\",\"list\",\"list_wrap\",\"sorted\",\"ρσ_global_object_id\",\"ρσ_set_implementation\",\"ρσ_set_keyfor\",\"ρσ_set_polyfill\",\"ρσ_set\",\"ρσ_set_wrap\",\"set\",\"set_wrap\",\"ρσ_dict_implementation\",\"ρσ_dict_polyfill\",\"ρσ_dict\",\"ρσ_dict_wrap\",\"dict\",\"dict_wrap\",\"NameError\",\"Exception\",\"AttributeError\",\"IndexError\",\"KeyError\",\"ValueError\",\"UnicodeDecodeError\",\"AssertionError\",\"ZeroDivisionError\",\"ρσ_in\",\"ρσ_desugar_kwargs\",\"ρσ_exists\",\"ρσ_eslice\",\"ρσ_delslice\",\"ρσ_flatten\",\"ρσ_unpack_asarray\",\"ρσ_extends\",\"ρσ_Iterable\",\"ρσ_interpolate_kwargs\",\"ρσ_interpolate_kwargs_constructor\",\"ρσ_getitem\",\"ρσ_setitem\",\"ρσ_delitem\",\"ρσ_bound_index\",\"ρσ_splice\",\"ρσ_mixin\",\"ρσ_instanceof\",\"sum\",\"map\",\"filter\",\"zip\",\"any\",\"all\",\"decimal_sep\",\"define_str_func\",\"ρσ_unpack\",\"ρσ_orig_split\",\"ρσ_orig_replace\",\"ρσ_repr_js_builtin\",\"ρσ_html_element_to_string\",\"ρσ_repr\",\"ρσ_str\",\"str\",\"repr\"]");

const module_variables = ['module', 'exports', 'async', 'asynchronous'].concat(rapydscript_curated_variables).join(', ')

const getTemp = () => {
  if (tempCache) return tempCache;
  tempCache = [require('temp').track()];
  tempCache[1] = tempCache[0].openSync({suffix: '.js'}).path;
  const buffer = Buffer.from(rapydscript_variables + require('fs').readFileSync(join(__dirname, 'node_modules/rapydscript-ng/release/baselib-plain-pretty.js')).toString() + '\nmodule.exports = function (module, exports, rapydscript_module) {\nrapydscript_module(' + module_variables + ')\n};');
  //bufferLength = buffer.length;
  require('fs').writeFileSync(tempCache[1], buffer);
  return tempCache;
}

const defaultOptions = {}

const applyTransform = (p, t, state, value, calleeName, moduleString) => {
  const ext = extname(value)
  const options = Object.assign({}, defaultOptions, state.opts)
  const rootPath = state.file.opts.sourceRoot || process.cwd()
  const scriptDirectory = dirname(resolve(transpiledCache[state.file.opts.filename] || state.file.opts.filename))
  const filePath = resolve(scriptDirectory, value)
  if (ext !== '.py' && ext !== '.pyj') {
    if (transpiledCache[state.file.opts.filename]) moduleString.replaceWith(t.StringLiteral(filePath))
    return
  }
  if (moduleCache[filePath]) return moduleString.replaceWith(t.StringLiteral(moduleCache[filePath]))
  const fullPath = filePath
  const [temp, tempFile] = getTemp()
  const tempPath = temp.openSync({suffix: '.js'}).path
  const newTempPath = temp.openSync({suffix: '.js'}).path
  let python_code = require('fs').readFileSync(fullPath).toString()
  python_code = python_code.replace(/await /g, 'awaits + ')
  require('child_process').execSync(process.execPath + ' ' + join(__dirname, 'node_modules/rapydscript-ng/bin/rapydscript') + ' compile -m  -o ' + tempPath, {input: python_code})
  let code = require('fs').readFileSync(tempPath).toString().replace(/awaits \+ /g, 'void ')
  code = 'require("' + tempFile + '")(module, module.exports, function (' + module_variables + ') {\n' + code + '\n});'
  require('fs').writeFileSync(tempPath, code)
  moduleString.replaceWith(t.StringLiteral(tempPath))
  moduleCache[fullPath] = tempPath
  transpiledCache[(process.platform === 'darwin' ? '/private' : '') + tempPath] = fullPath
  require('fs').watchFile(fullPath, () => {
    console.log('\n' + fullPath + ' changes, recompiling...\n')
    require('child_process').execSync(process.execPath + ' ' + join(__dirname, 'node_modules/rapydscript-ng/bin/rapydscript') + ' compile -m ' + fullPath + ' -o ' + newTempPath)
    code = require('fs').readFileSync(newTempPath).toString()
    code = 'require("' + tempFile + '")(module, module.exports, function (' + module_variables + ') {\n' + code + '\n});'
    require('fs').writeFileSync(tempPath, code)
  });
}

function applyAsync(state, async_function) {
  if (!transpiledCache[state.file.opts.filename]) return
  if (!async_function) return
  if (async_function.node && async_function.node.type === 'CallExpression') {
    if (async_function.node.callee.type !== 'FunctionExpression') return
    const first = async_function.node.callee.body.body[0]
    if (first && first.type === 'VariableDeclaration' && first.declarations[0].id.name === 'ρσ_anonfunc') {
      first.declarations[0].init.async = true
    }
    else {
      async_function.node.callee.async = true
    }
  }
  else if (async_function.node && async_function.node.type === 'FunctionExpression') async_function.node.async = true
}

function applyAwait(state, node) {
  if (!transpiledCache[state.file.opts.filename]) return
  if (node.argument.type === 'Literal' && node.argument.value === 0) return //To still allow void 0, if it happens to exist in the code
  node.operator = 'await ' //For some reason if we don't add a space it will concatenate the Unary Expression with the argument
}

function transformImportsInline ({ types: t }) {
  return {
    visitor: {
      ImportDeclaration (p, state) {
        applyTransform(p, t, state, p.node.source.value, 'import', {replaceWith: (ast) => (p.node.source = ast)})
      },
      CallExpression (p, state) {
        const callee = p.get('callee')
        if (!callee.isIdentifier()) return
        if (!callee.equals('name', 'require')) {
          if (callee.equals('name', 'async') || callee.equals('name', 'asynchronous')) applyAsync(state, p.get('arguments')[0])
          return
        }

        const arg = p.get('arguments')[0]
        if (!arg || !arg.isStringLiteral()) {
          return
        }

        applyTransform(p, t, state, arg.node.value, 'require', arg)
      },
      UnaryExpression(p, state) {
        if (p.node.operator !== 'void') return
        applyAwait(state, p.node)
      }
    }
  }
}

module.exports = transformImportsInline
module.exports.transformImportsInline = transformImportsInline
