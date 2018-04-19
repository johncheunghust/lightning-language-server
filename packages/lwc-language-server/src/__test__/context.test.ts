import * as fs from 'fs-extra';
import { join } from 'path';
import { WorkspaceContext } from '../context';
import { WorkspaceType } from '../shared';
import * as utils from '../utils';
import { CORE_ALL_ROOT, CORE_PROJECT_ROOT, FORCE_APP_ROOT, STANDARDS_ROOT, UTILS_ROOT, readAsTextDocument } from './test-utils';

it('WorkspaceContext', async () => {
    let context = new WorkspaceContext('test-workspaces/sfdx-workspace');
    expect(context.type).toBe(WorkspaceType.SFDX);
    expect(context.workspaceRoot).toBeAbsolutePath();
    let roots = context.namespaceRoots;
    expect(roots[0]).toBeAbsolutePath();
    expect(roots[0]).toEndWith(join(FORCE_APP_ROOT, 'lightningcomponents'));
    expect(roots[1]).toEndWith(join(UTILS_ROOT, 'lightningcomponents'));
    expect(roots.length).toBe(2);
    let modules = context.findAllModules();
    expect(modules[0]).toEndWith(join(FORCE_APP_ROOT, '/lightningcomponents/hello_world/hello_world.js'));
    expect(modules[10]).toEndWith(join(FORCE_APP_ROOT, 'lightningcomponents/wire_lds/wire_lds.js'));
    expect(modules[11]).toEndWith(join(UTILS_ROOT, '/lightningcomponents/todo_util/todo_util.js'));
    expect(modules.length).toBe(13);
    expect(context.getRelativeModulesDirs().length).toBe(2);

    context = new WorkspaceContext('test-workspaces/standard-workspace');
    roots = context.namespaceRoots;
    expect(context.type).toBe(WorkspaceType.STANDARD_LWC);
    expect(roots[0]).toEndWith(join(STANDARDS_ROOT, 'example'));
    expect(roots[1]).toEndWith(join(STANDARDS_ROOT, 'interop'));
    expect(roots[2]).toEndWith(join(STANDARDS_ROOT, 'other'));
    expect(roots.length).toBe(3);
    modules = context.findAllModules();
    expect(modules[0]).toEndWith(join(STANDARDS_ROOT, 'example', 'app', 'app.js'));
    expect(modules[1]).toEndWith(join(STANDARDS_ROOT, 'example', 'line', 'line.js'));
    expect(modules[2]).toEndWith(join(STANDARDS_ROOT, 'interop', 'ito', 'ito.js'));
    expect(modules[3]).toEndWith(join(STANDARDS_ROOT, 'other', 'text', 'text.js'));
    expect(modules.length).toBe(4);
    expect(context.getRelativeModulesDirs()).toEqual([]);

    context = new WorkspaceContext(CORE_ALL_ROOT);
    expect(context.type).toBe(WorkspaceType.CORE_ALL);
    roots = context.namespaceRoots;
    expect(roots[0]).toEndWith(join(CORE_ALL_ROOT, 'ui-force-components/modules/clients'));
    expect(roots[1]).toEndWith(join(CORE_ALL_ROOT, 'ui-force-components/modules/force'));
    expect(roots[2]).toEndWith(join(CORE_ALL_ROOT, 'ui-global-components/modules/one'));
    expect(roots.length).toBe(3);
    modules = context.findAllModules();
    expect(modules[0]).toEndWith(join(CORE_ALL_ROOT, '/ui-force-components/modules/clients/context-library-lwc/context-library-lwc.js'));
    expect(modules[1]).toEndWith(join(CORE_ALL_ROOT, '/ui-force-components/modules/force/input-phone/input-phone.js'));
    expect(modules[2]).toEndWith(join(CORE_ALL_ROOT, '/ui-global-components/modules/one/app-nav-bar/app-nav-bar.js'));
    expect(modules.length).toBe(3);
    expect(context.getRelativeModulesDirs().length).toBe(2);

    context = new WorkspaceContext(CORE_PROJECT_ROOT);
    expect(context.type).toBe(WorkspaceType.CORE_SINGLE_PROJECT);
    roots = context.namespaceRoots;
    expect(roots[0]).toEndWith(join(CORE_PROJECT_ROOT, 'modules', 'one'));
    expect(roots.length).toBe(1);
    modules = context.findAllModules();
    expect(modules[0]).toEndWith(join(CORE_PROJECT_ROOT, 'modules', 'one', 'app-nav-bar', 'app-nav-bar.js'));
    expect(modules.length).toBe(1);
    expect(context.getRelativeModulesDirs()).toEqual(['modules']);
});

it('isInsideModulesRoots()', () => {
    const context = new WorkspaceContext('test-workspaces/sfdx-workspace');

    let document = readAsTextDocument(FORCE_APP_ROOT + '/lightningcomponents/hello_world/hello_world.js');
    expect(context.isInsideModulesRoots(document)).toBeTruthy();

    document = readAsTextDocument(FORCE_APP_ROOT + '/aura/helloWorldApp/helloWorldApp.app');
    expect(context.isInsideModulesRoots(document)).toBeFalsy();

    document = readAsTextDocument(UTILS_ROOT + '/lightningcomponents/todo_util/todo_util.js');
    expect(context.isInsideModulesRoots(document)).toBeTruthy();
});

it('isLWCTemplate()', () => {
    const context = new WorkspaceContext('test-workspaces/sfdx-workspace');

    // .js is not a template
    let document = readAsTextDocument(FORCE_APP_ROOT + '/lightningcomponents/hello_world/hello_world.js');
    expect(context.isLWCTemplate(document)).toBeFalsy();

    // .html is a template
    document = readAsTextDocument(FORCE_APP_ROOT + '/lightningcomponents/hello_world/hello_world.html');
    expect(context.isLWCTemplate(document)).toBeTruthy();

    // aura cmps are not a template (sfdx assigns the 'html' language id to aura components)
    document = readAsTextDocument(FORCE_APP_ROOT + '/aura/helloWorldApp/helloWorldApp.app');
    expect(context.isLWCTemplate(document)).toBeFalsy();

    // html outside namespace roots is not a template
    document = readAsTextDocument(FORCE_APP_ROOT + '/aura/todoApp/randomHtmlInAuraFolder.html');
    expect(context.isLWCTemplate(document)).toBeFalsy();

    // .html in utils folder is a template
    document = readAsTextDocument(UTILS_ROOT + '/lightningcomponents/todo_util/todo_util.html');
    expect(context.isLWCTemplate(document)).toBeTruthy();
});

it('isLWCJavascript()', () => {
    const context = new WorkspaceContext('test-workspaces/sfdx-workspace');

    // lwc .js
    let document = readAsTextDocument(FORCE_APP_ROOT + '/lightningcomponents/hello_world/hello_world.js');
    expect(context.isLWCJavascript(document)).toBeTruthy();

    // lwc .htm
    document = readAsTextDocument(FORCE_APP_ROOT + '/lightningcomponents/hello_world/hello_world.html');
    expect(context.isLWCJavascript(document)).toBeFalsy();

    // aura cmps
    document = readAsTextDocument(FORCE_APP_ROOT + '/aura/helloWorldApp/helloWorldApp.app');
    expect(context.isLWCJavascript(document)).toBeFalsy();

    // .js outside namespace roots
    document = readAsTextDocument(FORCE_APP_ROOT + '/aura/todoApp/randomJsInAuraFolder.js');
    expect(context.isLWCJavascript(document)).toBeFalsy();

    // lwc .js in utils
    document = readAsTextDocument(UTILS_ROOT + '/lightningcomponents/todo_util/todo_util.js');
    expect(context.isLWCJavascript(document)).toBeTruthy();
});

it('configureSfdxProject()', () => {
    const context = new WorkspaceContext('test-workspaces/sfdx-workspace');
    const jsconfigPathForceApp = FORCE_APP_ROOT + '/lightningcomponents/jsconfig.json';
    const jsconfigPathUtilsOrig = UTILS_ROOT + '/lightningcomponents/jsconfig-orig.json';
    const jsconfigPathUtils = UTILS_ROOT + '/lightningcomponents/jsconfig.json';
    const eslintrcPathForceApp = FORCE_APP_ROOT + '/lightningcomponents/.eslintrc.json';
    const eslintrcPathUtilsOrig = UTILS_ROOT + '/lightningcomponents/eslintrc-orig.json';
    const eslintrcPathUtils = UTILS_ROOT + '/lightningcomponents/.eslintrc.json';
    const sfdxTypingsPath = 'test-workspaces/sfdx-workspace/.sfdx/typings/lwc';
    const forceignorePath = 'test-workspaces/sfdx-workspace/.forceignore';
    const settingsPath = 'test-workspaces/sfdx-workspace/.vscode/settings.json';

    // make sure no generated files are there from previous runs
    fs.removeSync(jsconfigPathForceApp);
    fs.removeSync(eslintrcPathForceApp);
    fs.copySync(jsconfigPathUtilsOrig, jsconfigPathUtils);
    fs.copySync(eslintrcPathUtilsOrig, eslintrcPathUtils);
    fs.removeSync(forceignorePath);
    fs.removeSync(sfdxTypingsPath);

    // verify typings/jsconfig after configuration:

    expect(jsconfigPathUtils).toExist();
    expect(eslintrcPathUtils).toExist();
    context.configureProject();

    // tslint:disable-next-line no-string-literal
    expect(context['sfdxPackageDirsPattern']).toBe('{force-app,utils}');

    // verify newly created jsconfig.json
    const jsconfigForceAppContent = utils.readFileSync(jsconfigPathForceApp);
    expect(jsconfigForceAppContent).toContain('    "compilerOptions": {'); // check formatting
    const jsconfigForceApp = JSON.parse(jsconfigForceAppContent);
    expect(jsconfigForceApp.compilerOptions.experimentalDecorators).toBe(true);
    expect(jsconfigForceApp.include[0]).toBe('**/*');
    expect(jsconfigForceApp.include[1]).toBe('../../../../.sfdx/typings/lwc/**/*.d.ts');
    expect(jsconfigForceApp.compilerOptions.baseUrl).toBeUndefined(); // baseUrl/paths set when indexing
    // verify updated jsconfig.json
    const jsconfigUtilsContent = utils.readFileSync(jsconfigPathUtils);
    expect(jsconfigUtilsContent).toContain('    "compilerOptions": {'); // check formatting
    const jsconfigUtils = JSON.parse(jsconfigUtilsContent);
    expect(jsconfigUtils.compilerOptions.target).toBe('es2017');
    expect(jsconfigUtils.compilerOptions.experimentalDecorators).toBe(true);
    expect(jsconfigUtils.include[0]).toBe('util/*.js');
    expect(jsconfigUtils.include[1]).toBe('**/*');
    expect(jsconfigUtils.include[2]).toBe('../../../.sfdx/typings/lwc/**/*.d.ts');

    // verify newly created .eslintrc.json
    const eslintrcForceAppContent = utils.readFileSync(eslintrcPathForceApp);
    expect(eslintrcForceAppContent).toContain('    "extends": "plugin:lwc/recommended",'); // check formatting
    const eslintrcForceApp = JSON.parse(eslintrcForceAppContent);
    expect(eslintrcForceApp.extends).toBe('plugin:lwc/recommended');
    expect(eslintrcForceApp.plugins[0]).toBe('lwc');
    // verify updated .eslintrc.json
    const eslintrcUtilsContent = utils.readFileSync(eslintrcPathUtils);
    expect(eslintrcUtilsContent).toContain('    "extends": "plugin:lwc/recommended",'); // check formatting
    const eslintrcUtils = JSON.parse(eslintrcUtilsContent);
    expect(eslintrcUtils.extends).toBe('plugin:lwc/recommended');
    expect(eslintrcUtils.plugins[0]).toBe('lwc');
    expect(eslintrcUtils.rules.semi).toBe('error');

    // .forceignore
    const forceignoreContent = utils.readFileSync(forceignorePath);
    expect(forceignoreContent).toContain(join('force-app', 'main', 'default', 'lightningcomponents', 'jsconfig.json'));
    expect(forceignoreContent).toContain(join('utils', 'meta', 'lightningcomponents', 'jsconfig.json'));
    expect(forceignoreContent).toContain(join('force-app', 'main', 'default', 'lightningcomponents', '.eslintrc.json'));
    expect(forceignoreContent).toContain(join('utils', 'meta', 'lightningcomponents', '.eslintrc.json'));

    // typings
    expect(sfdxTypingsPath + '/engine.d.ts').toExist();
    expect(sfdxTypingsPath + '/lds.d.ts').toExist();

    verifyWorkspaceSettings(settingsPath);
});

it('configureCoreProject()', () => {
    const context = new WorkspaceContext(CORE_PROJECT_ROOT);
    const jsconfigPath = CORE_PROJECT_ROOT + '/modules/jsconfig.json';
    const typingsPath = CORE_ALL_ROOT + '/.vscode/typings/lwc';
    const settingsPath = CORE_PROJECT_ROOT + '/.vscode/settings.json';

    // make sure no generated files are there from previous runs
    fs.removeSync(jsconfigPath);
    fs.removeSync(typingsPath);

    // configure and verify typings/jsconfig after configuration:
    context.configureProject();

    verifyJsconfigCore(jsconfigPath);
    verifyTypingsCore();

    const settings = JSON.parse(utils.readFileSync(settingsPath));
    verifyCoreSettings(settings);
    verifyWorkspaceSettings(settingsPath);
});

it('configureCoreAll()', () => {
    const context = new WorkspaceContext(CORE_ALL_ROOT);
    const jsconfigPathGlobal = CORE_ALL_ROOT + '/ui-global-components/modules/jsconfig.json';
    const jsconfigPathForce = CORE_ALL_ROOT + '/ui-force-components/modules/jsconfig.json';
    const codeWorkspacePath = CORE_ALL_ROOT + '/core.code-workspace';
    const launchPath = CORE_ALL_ROOT + '/.vscode/launch.json';

    // make sure no generated files are there from previous runs
    fs.removeSync(jsconfigPathGlobal);
    fs.removeSync(jsconfigPathForce);
    fs.removeSync(codeWorkspacePath);
    fs.removeSync(launchPath);

    // configure and verify typings/jsconfig after configuration:
    context.configureProject();

    // verify newly created jsconfig.json
    verifyJsconfigCore(jsconfigPathGlobal);
    verifyJsconfigCore(jsconfigPathForce);
    verifyTypingsCore();

    verifyCodeWorkspace(codeWorkspacePath);
    verifyCodeWorkspaceSettings(codeWorkspacePath);

    // launch.json
    const launchContent = utils.readFileSync(launchPath);
    expect(launchContent).toContain('"name": "SFDC (attach)"');
});

function verifyJsconfigCore(jsconfigPath: string) {
    const jsconfigContent = utils.readFileSync(jsconfigPath);
    expect(jsconfigContent).toContain('    "compilerOptions": {'); // check formatting
    const jsconfig = JSON.parse(jsconfigContent);
    expect(jsconfig.compilerOptions.experimentalDecorators).toBe(true);
    expect(jsconfig.include[0]).toBe('**/*');
    expect(jsconfig.include[1]).toBe('../../.vscode/typings/lwc/**/*.d.ts');
    fs.removeSync(jsconfigPath);
}

function verifyTypingsCore() {
    const typingsPath = CORE_ALL_ROOT + '/.vscode/typings/lwc';
    expect(typingsPath + '/engine.d.ts').toExist();
    expect(typingsPath + '/lds.d.ts').toExist();
    fs.removeSync(typingsPath);
}

function verifyCodeWorkspace(path: string) {
    const content = utils.readFileSync(path);
    const workspace = JSON.parse(content);
    const folders = workspace.folders;
    expect(folders.length).toBe(1);
    const folderPath = folders[0].path;
    expect(folderPath).toBeAbsolutePath();
    expect(folderPath).toEndWith(utils.unixify(CORE_ALL_ROOT));
    const settings = workspace.settings;
    expect(settings['java.home']).toBe('path_to_java_home');
    expect(settings['extensions.ignoreRecommendations']).toBeTruthy();
    verifyCoreSettings(settings);
}

function verifyCoreSettings(settings: any) {
    expect(settings['files.watcherExclude']).toBeDefined();
    expect(settings['eslint.nodePath']).toBeDefined();
    expect(settings['perforce.client']).toBe('username-localhost-blt');
    expect(settings['perforce.user']).toBe('username');
    expect(settings['perforce.port']).toBe('ssl:host:port');
}

function verifyCodeWorkspaceSettings(path: string) {
    const content = utils.readFileSync(path);
    const workspace = JSON.parse(content);
    const settings = workspace.settings;
    expect(settings['html.suggest.angular1']).toBe(false);
    expect(settings['html.suggest.ionic']).toBe(false);
}

function verifyWorkspaceSettings(settingsPath: string) {
    const settingsContent = utils.readFileSync(settingsPath);
    const settings = JSON.parse(settingsContent);
    expect(settings['html.suggest.angular1']).toBe(false);
    expect(settings['html.suggest.ionic']).toBe(false);
}
