<script lang="ts">
	import { user } from '$lib/stores/user';
	import { signInWithGoogle, signOutUser } from '$lib/services/auth';

	let signingIn = $state(false);

	async function handleSignIn() {
		signingIn = true;
		try {
			await signInWithGoogle();
		} catch (e) {
			console.error('Sign-in failed:', e);
		} finally {
			signingIn = false;
		}
	}
</script>

{#if $user.signedIn}
	<div class="user-menu">
		{#if $user.photoURL}
			<img class="avatar imgNoHover" src={$user.photoURL} alt={$user.displayName ?? 'User'} referrerpolicy="no-referrer" />
		{/if}
		<button class="sign-out-btn" onclick={signOutUser}>Sign out</button>
	</div>
{:else}
	<button class="sign-in-btn" onclick={handleSignIn} disabled={signingIn}>
		{signingIn ? 'Signing in...' : 'Sign in'}
	</button>
{/if}

<style>
	.user-menu {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		position: absolute;
		top: 12px;
		left: 175px;
		z-index: 10;
	}
	.avatar {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		border: 2px solid rgba(255, 255, 255, 0.5);
	}
	.sign-out-btn {
		background: none;
		border: 1px solid rgba(0, 0, 0, 0.2);
		border-radius: 6px;
		padding: 4px 10px;
		font-size: 0.7em;
		font-weight: 600;
		cursor: pointer;
		color: var(--text-color);
		transition: 0.2s;
	}
	.sign-out-btn:hover {
		background: rgba(0, 0, 0, 0.1);
	}
	.sign-in-btn {
		position: absolute;
		top: 12px;
		left: 175px;
		z-index: 10;
		background: white;
		border: 1px solid #ddd;
		border-radius: 8px;
		padding: 6px 14px;
		font-size: 0.75em;
		font-weight: 600;
		cursor: pointer;
		color: #333;
		transition: 0.2s;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}
	.sign-in-btn:hover {
		background: #f5f5f5;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
	}
	.sign-in-btn:disabled {
		opacity: 0.5;
		cursor: default;
	}
</style>
